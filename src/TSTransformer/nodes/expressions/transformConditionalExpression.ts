import ts from "byots";
import luau from "LuauAST";
import { TransformState } from "TSTransformer";
import { transformExpression } from "TSTransformer/nodes/expressions/transformExpression";
import { createTruthinessChecks } from "TSTransformer/util/createTruthinessChecks";
import { canTypeBeLuaFalsy } from "TSTransformer/util/types";

export function transformConditionalExpression(state: TransformState, node: ts.ConditionalExpression) {
	const condition = transformExpression(state, node.condition);
	const [whenTrue, whenTruePrereqs] = state.capture(() => transformExpression(state, node.whenTrue));
	const [whenFalse, whenFalsePrereqs] = state.capture(() => transformExpression(state, node.whenFalse));
	if (
		!canTypeBeLuaFalsy(state, state.getType(node.whenTrue)) &&
		luau.list.isEmpty(whenTruePrereqs) &&
		luau.list.isEmpty(whenFalsePrereqs)
	) {
		let left = createTruthinessChecks(state, condition, state.getType(node.condition));
		if (luau.isBinaryExpression(left)) {
			left = luau.create(luau.SyntaxKind.ParenthesizedExpression, { expression: left });
		}

		return luau.create(luau.SyntaxKind.ParenthesizedExpression, {
			expression: luau.binary(luau.binary(left, "and", whenTrue), "or", whenFalse),
		});
	}

	const tempId = luau.tempId();
	state.prereq(
		luau.create(luau.SyntaxKind.VariableDeclaration, {
			left: tempId,
			right: undefined,
		}),
	);

	luau.list.push(
		whenTruePrereqs,
		luau.create(luau.SyntaxKind.Assignment, {
			left: tempId,
			operator: "=",
			right: whenTrue,
		}),
	);
	luau.list.push(
		whenFalsePrereqs,
		luau.create(luau.SyntaxKind.Assignment, {
			left: tempId,
			operator: "=",
			right: whenFalse,
		}),
	);

	state.prereq(
		luau.create(luau.SyntaxKind.IfStatement, {
			condition,
			statements: whenTruePrereqs,
			elseBody: whenFalsePrereqs,
		}),
	);

	return tempId;
}
