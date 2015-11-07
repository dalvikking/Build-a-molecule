// Copyright 2013-2015, University of Colorado Boulder

/**
 * Represents a "Build a Molecule" molecule. Also useful as a type alias for code readability
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var namespace = require( 'BUILD_A_MOLECULE/namespace' );
  var MoleculeStructure = require( 'BUILD_A_MOLECULE/model/MoleculeStructure' );

  var Molecule = namespace.Molecule = function Molecule( numAtoms, numBonds ) {
    MoleculeStructure.call( this, numAtoms || 0, numBonds || 0 );
  };

  inherit( MoleculeStructure, Molecule, {
    // Where the molecule is right now
    get positionBounds() {
      // mutable way of handling this, so we need to make a copy
      var bounds = Bounds2.NOTHING.copy();
      _.each( this.atoms, function( atom ) {
        bounds.includeBounds( atom.positionBounds );
      } );
      return bounds;
    },

    // Where the molecule will end up
    get destinationBounds() {
      // mutable way of handling this, so we need to make a copy
      var bounds = Bounds2.NOTHING.copy();
      _.each( this.atoms, function( atom ) {
        bounds.includeBounds( atom.destinationBounds );
      } );
      return bounds;
    },

    // @param {Vector2}
    shiftDestination: function( delta ) {
      _.each( this.atoms, function( atom ) {
        // TODO: memory: consider alternate mutable form atom.destination.add( delta )
        atom.destination = atom.destination.plus( delta );
      } );
    }
  } );

  return Molecule;
} );
