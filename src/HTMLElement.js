var inherit = require('raptor-util/inherit');
var AttributeCollection = require('./AttributeCollection');
var Text = require('./Text');
var Comment = require('./Comment');
var Node = require('./Node');

function HTMLElement(tagName, attrCount, childCount) {
    var namespaceURI;
    var isTextArea;

    if (tagName instanceof HTMLElement) {
        var htmlElement = tagName;
        tagName = htmlElement.nodeName;
        namespaceURI = htmlElement.namespaceURI;
        isTextArea = htmlElement._isTextArea;
        Node.call(this, htmlElement);
        AttributeCollection.call(this, htmlElement);
    } else {
        switch(tagName) {
            case 'svg':
                namespaceURI = 'http://www.w3.org/2000/svg';
                break;
            case 'math':
                namespaceURI = 'http://www.w3.org/1998/Math/MathML';
                break;
            case 'textarea':
            case 'TEXTAREA':
                isTextArea = true;
                break;
        }

        Node.call(this, childCount);
        AttributeCollection.call(this, attrCount);
    }

    this._isTextArea = isTextArea;
    this.namespaceURI = namespaceURI;
    this.nodeName = tagName;
    this._value = undefined;
}

HTMLElement.prototype = {
    nodeType: 1,

    _nsAware: true,

    cloneNode: function() {
        return new HTMLElement(this);
    },

    a: AttributeCollection.prototype.a,

    as: AttributeCollection.prototype.as,

    /**
     * Shorthand method for creating and appending an HTML element
     *
     * @param  {String} tagName    The tag name (e.g. "div")
     * @param  {int|null} attrCount  The number of attributes (or `null` if not known)
     * @param  {int|null} childCount The number of child nodes (or `null` if not known)
     */
    e: function(tagName, attrCount, childCount) {
        var child = this.appendChild(new HTMLElement(tagName, attrCount, childCount));

        if (attrCount === 0 && childCount === 0) {
            return this._finishChild();
        } else {
            return child;
        }
    },

    /**
     * Shorthand method for creating and appending a Text node with a given value
     * @param  {String} value The text value for the new Text node
     */
    t: function(value) {
        this.appendChild(new Text(value));
        return this._finishChild();
    },

    /**
     * Shorthand method for creating and appending a Comment node with a given value
     * @param  {String} value The value for the new Comment node
     */
    c: function(value) {
        this.appendChild(new Comment(value));
        return this._finishChild();
    },

    /**
     * Shorthand method for creating and appending a static node. The provided node is automatically cloned
     * using a shallow clone since it will be mutated as a result of setting `nextSibling` and `parentNode`.
     *
     * @param  {String} value The value for the new Comment node
     */
    n: function(node) {
        this.appendChild(node.cloneNode());
        return this._finishChild();
    },

    actualize: function(document) {
        var el;
        var namespaceURI = this.namespaceURI;
        var tagName = this.nodeName;

        if (namespaceURI) {
            el = document.createElementNS(namespaceURI, tagName);
        } else {
            el = document.createElement(tagName);
        }

        var i;
        var attributes = this.attributes;
        var attrCount = attributes.length;

        for (i=0; i<attrCount; i++) {
            var attr = attributes[i];
            if (attr.namespaceURI) {
                el.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
            } else {
                el.setAttribute(attr.name, attr.value);
            }
        }

        if (this._isTextArea) {
            el.value = this.value;
        } else {
            var childNodes = this.childNodes;
            if (childNodes) {
                var childCount = childNodes.length;
                for (i=0; i<childCount; ++i) {
                    var childNode = childNodes[i];
                    el.appendChild(childNode.actualize(document));
                }
            }
        }

        return el;
    },

    hasAttributeNS: function(namespaceURI, name) {
        // We don't care about the namespaces since the there
        // is no chance that attributes with the same name will have
        // different namespaces
        return this._attrLookup[name] !== undefined;
    }
};

inherit(HTMLElement, Node);

var proto = HTMLElement.prototype;

Object.defineProperty(proto, 'checked', {
    get: function () {
        return this._attrLookup.checked !== undefined;
    }
});

Object.defineProperty(proto, 'selected', {
    get: function () {
        return this._attrLookup.selected !== undefined;
    }
});

Object.defineProperty(proto, 'value', {
    get: function () {
        return this._value || this._attrLookup.value;
    },
    set: function (value) {
        this._value = value;
    }
});

Object.defineProperty(proto, 'disabled', {
    get: function () {
        return this._attrLookup.disabled !== undefined;
    }
});

module.exports = HTMLElement;