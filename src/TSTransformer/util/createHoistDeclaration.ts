import ts from "byots";
import luau from "LuauAST";
import { TransformState } from "TSTransformer";
import { transformIdentifierDefined } from "TSTransformer/nodes/expressions/transformIdentifier";

export function createHoistDeclaration(state: TransformState, statement: ts.Statement | ts.CaseClause) {
	const hoists = state.hoistsByStatement.get(statement);
	if (hoists && hoists.length > 0) {
		return luau.create(luau.SyntaxKind.VariableDeclaration, {
			left: luau.list.make(...hoists.map(hoistId => transformIdentifierDefined(state, hoistId))),
			right: undefined,
		});
	}
}
