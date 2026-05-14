function detectFloatingPointEqualityRisk(ast) {

  const detections = [];

  function containsArithmetic(node) {
    if (!node) {
      return false;
    }

    if (
      node.type === "BinaryExpression" &&
      ["+", "-", "*", "/", "%"].includes(node.operator)
    ) {
      return true;
    }

    let found = false;

    traverseAst(node, (child) => {
      if (
        child.type === "BinaryExpression" &&
        ["+", "-", "*", "/", "%"].includes(child.operator)
      ) {
        found = true;
      }
    });

    return found;
  }

  traverseAst(ast, (node) => {

    if (node.type !== "BinaryExpression") {
      return;
    }

    const comparisonOperators = [
      "==",
      "===",
      "!=",
      "!=="
    ];

    if (
      !comparisonOperators.includes(node.operator)
    ) {
      return;
    }

    const leftHasArithmetic =
      containsArithmetic(node.left);

    const rightHasArithmetic =
      containsArithmetic(node.right);

    if (
      !leftHasArithmetic &&
      !rightHasArithmetic
    ) {
      return;
    }

    detections.push({
      type: "FLOATING_POINT_EQUALITY_RISK",

      severity: "warning",

      message:
        "Potential unsafe floating-point equality comparison detected.",

      explanation:
        "Arithmetic expressions involving floating-point values may produce precision errors, making direct equality comparisons unreliable.",

      suggestion:
        "Consider comparing with a tolerance, e.g. Math.abs(a - b) < epsilon.",

      metadata: {
        operator: node.operator
      }
    });

  });

  return detections;
}