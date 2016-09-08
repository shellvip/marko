var EMPTY_ARRAY = require('./util').EMPTY_ARRAY;

var DocumentFragment;

function assignNamespace(node, namespaceURI) {
    node.namespaceURI = namespaceURI;
    var childNodes = node.childNodes;
    var childCount = node._childCount;

    for (var i=0; i<childCount; i++) {
        var child = childNodes[i];
        if (child._nsAware) {
            assignNamespace(childNodes[i], namespaceURI);
        }
    }
}

function Node(finalChildCount) {
    var childNodes;
    var childCount;
    var firstChild;

    if (finalChildCount instanceof Node) {
        var node = finalChildCount;
        childNodes = node.childNodes;
        finalChildCount = node._finalChildCount;
        childCount = node._childCount;
        firstChild = node._firstChild;
    } else {
        if (finalChildCount > 0) {
            childNodes = new Array(finalChildCount);
        } else if (finalChildCount === 0) {
            childNodes = EMPTY_ARRAY;
        } else {
            childNodes = [];
        }
        childCount = 0;
    }

    this.childNodes = childNodes;
    this._finalChildCount = finalChildCount;
    this._childCount = childCount;
    this._firstChild = firstChild;

    this.parentNode = undefined;
    this._nextSibling = undefined;
}

Node.prototype = {
    removeChildren: function() {
        this.childNodes.length = 0;
        this._firstChild = undefined;
        this._childCount = 0;
    },

    get firstChild() {
        var firstChild = this._firstChild;

        if (firstChild && firstChild.nodeType === 11 /* DocumentFragment */) {
            return firstChild.firstChild;
        }

        return firstChild;
    },

    get nextSibling() {
        var nextSibling = this._nextSibling;

        if (nextSibling) {
            if (nextSibling.nodeType === 11 /* DocumentFragment */) {
                var firstChild = nextSibling.firstChild;
                return firstChild || nextSibling.nextSibling;
            }
        } else {
            var parentNode = this.parentNode;
            if (parentNode && parentNode.nodeType === 11) {
                return parentNode.nextSibling;
            }
        }

        return nextSibling;
    },

    beginAsync: function() {
        return this.appendChild(new DocumentFragment());
    },

    appendChild: function(child) {
        if (this._isTextArea) {
            if (child.nodeType === 3) {
                var currentValue = this.value;
                this.value = currentValue ? currentValue + child.nodeValue : child.nodeValue;
            } else {
                throw new Error('Invalid child');
            }
        } else {
            var namespaceURI;

            if (child._nsAware && (namespaceURI = this.namespaceURI) && !child.namespaceURI) {
                assignNamespace(child, namespaceURI);
            }

            var index = this._childCount++;
            this.childNodes[index] = child;

            child.parentNode = this;

            if (index === 0) {
                this._firstChild = child;
            } else {
                this.childNodes[index-1]._nextSibling = child;
            }
        }

        return child;
    },

    _finishChild: function() {
        if (this._childCount === this._finalChildCount && this.parentNode) {
            return this.parentNode._finishChild();
        } else {
            return this;
        }
    }
};

module.exports = Node;

DocumentFragment = require('./DocumentFragment');