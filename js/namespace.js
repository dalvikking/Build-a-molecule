// Copyright 2002-2013, University of Colorado

// mostly used for debugging purposes
define( function( require ) {
  'use strict';
  
  var Property = require( 'AXON/Property' );
  
  return {
    scenery: require( 'SCENERY/main' ),
    kite: require( 'KITE/main' ),
    dot: require( 'DOT/main' ),
    core: require( 'PHET_CORE/main' ),
    assert: require( 'ASSERT/assert' ),
    
    Bucket: require( 'PHETCOMMON/model/Bucket' ),
    BucketFront: require( 'SCENERY_PHET/bucket/BucketFront' ),
    BucketHole: require( 'SCENERY_PHET/bucket/BucketHole' ),
    NextPreviousNavigationNode: require( 'SCENERY_PHET/NextPreviousNavigationNode' ),
    Element: require( 'NITROGLYCERIN/Element' ),
    Atom: require( 'NITROGLYCERIN/Atom' ),
    
    Property: Property,
    PropertySet: require( 'AXON/PropertySet' ),
    
    soundEnabled: new Property( false )
  };
} );
