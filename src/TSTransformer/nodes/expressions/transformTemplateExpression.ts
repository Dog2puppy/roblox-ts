import ts from "byots";
import * as lua from "LuaAST";
import { TransformState } from "TSTransformer";
import { createStringFromLiteral } from "TSTransformer/util/createStringFromLiteral";
import { ensureTransformOrder } from "TSTransformer/util/ensureTransformOrder";
import { binaryExpressionChain } from "TSTransformer/util/expressionChain";
import { isStringType } from "TSTransformer/util/types";

export function transformTemplateExpression(state: TransformState, node: ts.TemplateExpression) {
	if (node.templateSpans.length === 0) {
		return createStringFromLiteral(node.head);
	}

	const expressions = new Array<lua.Expression>();

	if (node.head.text.length > 0) {
		expressions.push(createStringFromLiteral(node.head));
	}

	const orderedExpressions = ensureTransformOrder(
		state,
		node.templateSpans.map(templateSpan => templateSpan.expression),
	);

	for (let i = 0; i < node.templateSpans.length; i++) {
		const templateSpan = node.templateSpans[i];
		let exp = orderedExpressions[i];
		if (!isStringType(state.getType(templateSpan.expression))) {
			exp = lua.create(lua.SyntaxKind.CallExpression, {
				expression: lua.globals.tostring,
				args: lua.list.make(exp),
			});
		}
		expressions.push(exp);

		if (templateSpan.literal.text.length > 0) {
			expressions.push(createStringFromLiteral(templateSpan.literal));
		}
	}

	return binaryExpressionChain(expressions, "..");
}
