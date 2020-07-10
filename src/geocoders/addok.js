'use strict';

import { getJSON, template } from '../util';
import L from 'leaflet';

const TYPE_LABEL = {
    housenumber: 'Numéro',
    street: 'Rue',
    locality: 'Lieux-dit',
    municipality: 'Commune',
};

export var AddOk = L.Class.extend({
    options: {
        serviceUrl: 'http://api-adresse.data.gouv.fr',
        limit: 5,
        htmlTemplate: function (r) {
            var parts = [];

			/* some available classes:
				leaflet-control-geocoder-address-detail
				leaflet-control-geocoder-address-context
			*/
            parts.push('<span class="leaflet-control-geocoder-address-item"> {label} </span>({type})<span>' + '</span>');
            parts.push('<span class="' + (parts.length > 0 ? 'leaflet-control-geocoder-address-detail' : '') +
                '">{context}</span>');

            return template(parts.join('<br/>'), r, true);
        }

    },

    initialize: function (options) {
        L.setOptions(this, options);
    },

    geocode: function (query, cb, context) {

        var params = L.extend({
            q: query,
            limit: this.options.limit
        }, this.options.geocodingQueryParams);
        var that = this;

        getJSON(this.options.serviceUrl + '/search/', params, function (data) {
            var results = [],
                i,
                f,
                c,
                latLng,
                extent,
                bbox;
            if (data && data.features) {
                for (i = 0; i < data.features.length; i++) {
                    f = data.features[i];
                    c = f.geometry.coordinates;
                    latLng = L.latLng(c[1], c[0]);
                    extent = f.properties.extent;

                    if (extent) {
                        bbox = L.latLngBounds([extent[1], extent[0]], [extent[3], extent[2]]);
                    } else {
                        bbox = L.latLngBounds(latLng, latLng);
                    }
                    
                    // Translate the type in french
                    if (f.properties.type) {
                        f.properties.type = TYPE_LABEL[f.properties.type];
                    }
                    
                    results.push({
                        name: f.properties.name,
                        center: latLng,
                        bbox: bbox,
                        html: that.options.htmlTemplate ?
                            that.options.htmlTemplate(f.properties)
                            : undefined
                    });
                }
            }

            cb.call(context, results);
        });
    },

    suggest: function (query, cb, context) {
        return this.geocode(query, cb, context);
    },

    reverse: function (location, scale, cb, context) {
        var params = L.extend({
            lat: location.lat,
            lon: location.lng
        }, this.options.reverseQueryParams);
        var that = this;
        getJSON(this.options.serviceUrl + '/reverse/', params, function (data) {
            var results = [],
                i,
                f,
                c,
                latLng,
                extent,
                bbox;
            if (data && data.features) {
                for (i = 0; i < data.features.length; i++) {
                    f = data.features[i];
                    c = f.geometry.coordinates;
                    latLng = L.latLng(c[1], c[0]);
                    extent = f.properties.extent;

                    if (extent) {
                        bbox = L.latLngBounds([extent[1], extent[0]], [extent[3], extent[2]]);
                    } else {
                        bbox = L.latLngBounds(latLng, latLng);
                    }

                    results.push({
                        name: f.properties.name,
                        center: latLng,
                        bbox: bbox,
                        html: that.options.htmlTemplate ?
                            that.options.htmlTemplate(f.properties)
                            : undefined
                    });
                }
            }

            cb.call(context, results);
        });
    }
});


export function addok(key) {
    return new AddOk(key);
}