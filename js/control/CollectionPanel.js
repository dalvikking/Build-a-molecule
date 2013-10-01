// Copyright 2002-2013, University of Colorado

/**
 * A panel that shows collection areas for different collections, and allows switching between those collections
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define( function( require ) {
  'use strict';
  
  var assert = require( 'ASSERT/assert' )( 'build-a-molecule' );
  var namespace = require( 'BAM/namespace' );
  var Constants = require( 'BAM/Constants' );
  var Strings = require( 'BAM/Strings' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var CollectionAreaNode = require( 'BAM/control/CollectionAreaNode' );
  var CollectionList = require( 'BAM/model/CollectionList' );
  var LayoutBounds = require( 'BAM/model/LayoutBounds' );
  var KitCollection = require( 'BAM/model/KitCollection' );
  var CollectionBox = require( 'BAM/model/CollectionBox' );
  var MoleculeList = require( 'BAM/model/MoleculeList' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Text = require( 'SCENERY/nodes/Text' );
  var HTMLText = require( 'SCENERY/nodes/HTMLText' );
  var NextPreviousNavigationNode = require( 'SCENERY_PHET/NextPreviousNavigationNode' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var SoundToggleButton = require( 'SCENERY_PHET/SoundToggleButton' );
  var StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  var PropertySet = require( 'AXON/PropertySet' );
  var Scene = require( 'SCENERY/Scene' );
  
  var containerPadding = 15;
  
  var CollectionPanel = namespace.CollectionPanel = function CollectionPanel( collectionList, isSingleCollectionMode, collectionAttachmentCallbacks, toModelBounds ) {
    var panel = this;
    Node.call( this, {} );
    
    var y = 0; // TODO: improve layout code using GeneralLayoutNode?
    
    this.layoutNode = new Node();
    this.collectionAreaHolder = new Node();
    this.backgroundHolder = new Node();
    this.collectionAreaMap = {}; // kitCollection id => node
    this.collectionAttachmentCallbacks = collectionAttachmentCallbacks;
    
    // move it over so the background will have padding
    this.layoutNode.setTranslation( containerPadding, containerPadding );

    // "Your Molecule Collection"
    var moleculeCollectionText = new HTMLText( Strings.collection_yourMoleculeCollection, {
      font: new PhetFont( {
        size: 22
      } )
    } );
    this.layoutNode.addChild( moleculeCollectionText );
    moleculeCollectionText.top = 0;
    y += moleculeCollectionText.height + 5;
    
    // "Collection X" with arrows
    var currentCollectionText = new Text( '', {
      font: new PhetFont( {
        size: 16,
        weight: 'bold'
      } )
    } );
    collectionList.currentCollectionProperty.link( function() {
      currentCollectionText.text = StringUtils.format( Strings.collection_label, collectionList.currentIndex + 1 );
    } );
    var collectionSwitcher = new NextPreviousNavigationNode( currentCollectionText, {
      arrowColor: Constants.kitArrowBackgroundEnabled,
      arrowStrokeColor: Constants.kitArrowBorderEnabled,
      arrowWidth: 14,
      arrowHeight: 18,
      next: function() {
        collectionList.switchToNextCollection();
      },
      previous: function() {
        collectionList.switchToPreviousCollection();
      }
    } );
    function updateSwitcher() {
      collectionSwitcher.hasNext = collectionList.hasNextCollection();
      collectionSwitcher.hasPrevious = collectionList.hasPreviousCollection();
    }
    collectionList.currentCollectionProperty.link( updateSwitcher );
    collectionList.on( 'addedCollection', updateSwitcher );
    collectionList.on( 'removedCollection', updateSwitcher );
    this.layoutNode.addChild( collectionSwitcher );
    collectionSwitcher.top = y;
    y += collectionSwitcher.height + 10;

    // all of the collection boxes themselves
    this.layoutNode.addChild( this.collectionAreaHolder );
    this.collectionAreaHolder.y = y;
    y += 5; // TODO: height?

    // sound on/off
    this.soundToggleButton = new SoundToggleButton( namespace.soundEnabled );
    this.layoutNode.addChild( this.soundToggleButton );
    this.soundToggleButton.top = y;

    // add our two layers: background and controls
    this.addChild( this.backgroundHolder );
    this.addChild( this.layoutNode );

    // anonymous function here, so we don't create a bunch of fields
    function createCollectionNode( collection ) {
      panel.collectionAreaMap[collection.id] = new CollectionAreaNode( collection, isSingleCollectionMode, toModelBounds );
    }

    // create nodes for all current collections
    _.each( collectionList.collections, function( collection ) {
      createCollectionNode( collection );
    } );

    // if a new collection is added, create one for it
    collectionList.on( 'addedCollection', function( collection ) {
      createCollectionNode( collection );
    } );

    // use the current collection
    this.useCollection( collectionList.currentCollection );

    collectionList.currentCollectionProperty.link( function( newCollection ) {
      panel.useCollection( newCollection );
    } );
  };
  
  /**
   * Used to get the panel width so that we can construct the model (and thus kit) beforehand
   *
   * @param isSingleCollectionMode Whether we are on single (1st tab) or multiple (2nd tab) mode
   * @return Width of the entire collection panel
   */
  CollectionPanel.getCollectionPanelModelWidth = function( isSingleCollectionMode ) {
    // construct a dummy collection panel and check its width
    var collection = new KitCollection();
    collection.addCollectionBox( new CollectionBox( MoleculeList.H2O, 1 ) );
    var collectionList = new CollectionList( collection, new LayoutBounds( false, 0 ), new PropertySet( {} ) );
    var collectionPanel = new CollectionPanel( collectionList, isSingleCollectionMode, [], function() { return Bounds2.NOTHING; } );
    
    return Constants.modelViewTransform.viewToModelDeltaX( collectionPanel.width );
  };

  return inherit( Node, CollectionPanel, {
    updateLayout: function() {
      this.soundToggleButton.top = this.collectionAreaHolder.bottom + 25;
      var centerX = this.layoutNode.width / 2;
      _.each( this.layoutNode.children, function( child ) {
        child.centerX = centerX;
      } );
    },
    
    useCollection: function( collection ) {
      // swap out the inner collection area
      this.collectionAreaHolder.removeAllChildren();
      var collectionAreaNode = this.collectionAreaMap[collection.id];
      this.collectionAreaHolder.addChild( collectionAreaNode );

      this.updateLayout();

      // if we are hooked up, update the box locations. otherwise, listen to the canvas for when it is
      if ( this.hasCanvasAsParent() ) {
        collectionAreaNode.updateCollectionBoxLocations();
      }
      else {
        // we need to listen for this because the update needs to use canvas' global/local/view coordinate transformations
        this.collectionAttachmentCallbacks.push( function() {
          collectionAreaNode.updateCollectionBoxLocations();
        } );
      }

      /*---------------------------------------------------------------------------*
      * draw new background
      *----------------------------------------------------------------------------*/
      this.backgroundHolder.removeAllChildren();
      // TODO: this is a major performance drain! just set the bounds!
      var background = new Rectangle( 0, 0, this.getPlacementWidth(), this.getPlacementHeight(), {
        fill: Constants.moleculeCollectionBackground,
        stroke: Constants.moleculeCollectionBorder
      } );
      this.backgroundHolder.addChild( background );
    },

    /**
     * Walk up the scene graph, looking to see if we are a (grand)child of a canvas
     *
     * @return If an ancestor is a BuildAMoleculeCanvas
     */
    hasCanvasAsParent: function() {
      var node = this;
      while ( node.getParent() !== null ) {
        node = node.getParent();
        if ( node instanceof Scene ) {
          return true;
        }
      }
      return false;
    },
    
    getPlacementWidth: function() {
      return this.layoutNode.width + containerPadding * 2;
    },

    getPlacementHeight: function() {
      // how much height we need with proper padding
      var requiredHeight = this.layoutNode.height + containerPadding * 2;

      // how much height we will take up to fit our vertical size perfectly
      var fixedHeight = Constants.stageSize.height - Constants.viewPadding * 2; // we will have padding above and below

      if ( requiredHeight > fixedHeight ) {
          console.log( 'Warning: collection panel is too tall. required: ' + requiredHeight + ', but has: ' + fixedHeight );
      }

      return fixedHeight;
    }
  } );
} );