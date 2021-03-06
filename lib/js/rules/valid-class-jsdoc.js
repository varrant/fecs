/**
 * @file Rule to validate jsdoc of classes.
 * @author chris<wfsr@foxmail.com>
 */
'use strict';

var doctrine = require('doctrine2');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        schema: []
    },

    create: function (context) {

        var sourceCode = context.getSourceCode();

        /**
         * Checks whether or not a node is the null literal.
         *
         * @param {Node} node A node to check.
         * @return {boolean} whether or not a node is the null literal.
         */
        function isNullLiteral(node) {
            return node === null || node.type === 'Literal' && node.value === null;
        }


        function parseDoc(commentNode) {
            try {
                return doctrine.parse(
                    commentNode.value,
                    {
                        strict: true,
                        unwrap: true,
                        sloppy: true,
                        lineNumbers: true,
                        recoverable: true
                    }
                );
            }
            catch (ex) {
                return null;
            }
        }

        function getJSDoc(node) {
            var leadingComments = sourceCode.getComments(node).leading;
            var comment = leadingComments[leadingComments.length - 1];

            if (!comment || comment.type !== 'Block' || comment.value[0] !== '*') {
                return null;
            }


            return parseDoc(comment);
        }


        function validate(node) {
            var jsdoc = getJSDoc(node);

            var stat = jsdoc && jsdoc.tags.reduce(function (stat, tag) {
                stat[tag.title] = tag;
                return stat;
            }, {}) || {};

            if (!stat.class) {
                context.report(node, 'Expected to user `@class` to tag a class.baidu048');
            }

            var hasSuper = !isNullLiteral(node.superClass);
            if (hasSuper && !stat.extends) {
                context.report(node, 'Expected to use `@extends` to tag a class extends.baidu049');
            }
        }

        function checkPrivilege(node) {

            if (node.static) {
                return;
            }

            var jsdoc = getJSDoc(node);
            var stat = jsdoc && jsdoc.tags.reduce(function (stat, tag) {
                stat[tag.title] = tag;
                return stat;
            }, {}) || {};

            if (!(stat.private || stat.protected || stat.public)) {
                context.report(
                    node,
                    'Expected to use `@public`, `@protected` or `@private` to tag the property or method.baidu051'
                );
            }
        }

        function checkLends(node) {
            if (node.parent.type !== 'CallExpression') {
                return;
            }

            if (node.property.type !== 'Identifier' || node.property.name !== 'prototype') {
                return;
            }

            var implement = node.parent.arguments.filter(function (arg) {
                return arg !== node && arg.type === 'ObjectExpression';
            })[0];

            if (implement) {
                var jsdoc = getJSDoc(implement);
                var hasLends = function (tag) {
                    return tag.title === 'lends';
                };

                if (!jsdoc || !jsdoc.tags.some(hasLends)) {
                    context.report(implement, 'Expected to use `@lends` to tag this.baidu050');
                }
            }
        }


        return {
            ClassExpression: validate,
            ClassDeclaration: validate,
            MethodDefinition: checkPrivilege,
            MemberExpression: checkLends
        };
    }
};
