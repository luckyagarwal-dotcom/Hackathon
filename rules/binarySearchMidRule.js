function detectBinarySearchMidOverflow(ast) {

  const detections = [];

  const boundaryNames = [
    "low",
    "high",
    "left",
    "right",
    "lo",
    "hi",
    "start",
    "end"
  ];

  function isBoundaryName(name) {
    return boundaryNames.includes(name);
  }

  function isBinarySearchContext(node) {
    let foundMidAccess = false;

    traverseAst(node, (child) => {
      if (
        child.type === "MemberExpression" &&
        child.property &&
        child.property.type === "Identifier" &&
        child.property.name === "mid"
      ) {
        foundMidAccess = true;
      }
    });

    return foundMidAccess;
  }

  traverseAst(ast, (node) => {

    if (node.type !== "VariableDeclarator") {
      return;
    }

    if (
      !node.id ||
      node.id.type !== "Identifier" ||
      node.id.name !== "mid"
    ) {
      return;
    }

    if (!node.init) {
      return;
    }

    let matchedPattern = false;

    // Pattern 1:
    // Math.floor((left + right) / 2)

    if (
      node.init.type === "CallExpression" &&
      node.init.callee &&
      node.init.callee.type === "MemberExpression" &&
      node.init.callee.object &&
      node.init.callee.object.name === "Math" &&
      node.init.callee.property &&
      node.init.callee.property.name === "floor"
    ) {
      const arg = node.init.arguments[0];

      if (
        arg &&
        arg.type === "BinaryExpression" &&
        arg.operator === "/"
      ) {
        const leftExpr = arg.left;
        const rightExpr = arg.right;

        if (
          rightExpr &&
          rightExpr.type === "NumericLiteral" &&
          rightExpr.value === 2 &&
          leftExpr &&
          leftExpr.type === "BinaryExpression" &&
          leftExpr.operator === "+"
        ) {
          if (
            leftExpr.left.type === "Identifier" &&
            leftExpr.right.type === "Identifier"
          ) {
            const leftName = leftExpr.left.name;
            const rightName = leftExpr.right.name;

            if (
              isBoundaryName(leftName) &&
              isBoundaryName(rightName)
            ) {
              matchedPattern = true;
            }
          }
        }
      }
    }

    // Pattern 2:
    // (left + right) / 2

    if (
      node.init.type === "BinaryExpression" &&
      node.init.operator === "/"
    ) {
      const leftExpr = node.init.left;
      const rightExpr = node.init.right;

      if (
        rightExpr &&
        rightExpr.type === "NumericLiteral" &&
        rightExpr.value === 2 &&
        leftExpr &&
        leftExpr.type === "BinaryExpression" &&
        leftExpr.operator === "+"
      ) {
        if (
          leftExpr.left.type === "Identifier" &&
          leftExpr.right.type === "Identifier"
        ) {
          const leftName = leftExpr.left.name;
          const rightName = leftExpr.right.name;

          if (
            isBoundaryName(leftName) &&
            isBoundaryName(rightName)
          ) {
            matchedPattern = true;
          }
        }
      }
    }

    if (!matchedPattern) {
      return;
    }

    const parentLoop = ast;

    if (!isBinarySearchContext(parentLoop)) {
      return;
    }

    detections.push({
      type: "BINARY_SEARCH_MID_FORMULA",

      severity: "info",

      message:
        "Classic binary search midpoint calculation detected.",

      explanation:
        "Using (left + right) / 2 works, but the safer universal binary search pattern is left + (right - left) / 2.",

      suggestion:
        "Consider using left + (right - left) / 2 for more robust binary search implementation habits.",

      metadata: {
        variable: "mid"
      }
    });

  });

  return detections;
}