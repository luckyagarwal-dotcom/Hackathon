function detectMissingHashMapExistenceCheck(ast) {

  const detections = [];

  function getComputedAccessSignature(node) {
    if (
      !node ||
      node.type !== "MemberExpression" ||
      !node.computed
    ) {
      return null;
    }

    const object =
      generateReadableCode(node.object);

    const property =
      generateReadableCode(node.property);

    return `${object}[${property}]`;
  }

  function findSafeInitializations(signature) {
    const safe = new Set();

    traverseAst(ast, (node) => {

      // map[key] = []
      if (
        node.type === "AssignmentExpression"
      ) {
        const leftSig =
          getComputedAccessSignature(node.left);

        if (!leftSig) {
          return;
        }

        // direct assignment
        safe.add(leftSig);

        // map[key] = map[key] || []
        if (
          node.operator === "=" &&
          node.right &&
          node.right.type === "LogicalExpression"
        ) {
          safe.add(leftSig);
        }
      }

      // map[key] ??= []
      if (
        node.type === "AssignmentExpression" &&
        node.operator === "??="
      ) {
        const leftSig =
          getComputedAccessSignature(node.left);

        if (leftSig) {
          safe.add(leftSig);
        }
      }

      // if (!map[key])
      if (
        node.type === "IfStatement" &&
        node.test &&
        node.test.type === "UnaryExpression" &&
        node.test.operator === "!"
      ) {
        const sig =
          getComputedAccessSignature(
            node.test.argument
          );

        if (sig) {
          safe.add(sig);
        }
      }

    });

    return safe;
  }

  const safeInitializations =
    findSafeInitializations();

  traverseAst(ast, (node) => {

    if (
      node.type !== "CallExpression"
    ) {
      return;
    }

    // map[key].push(...)
    if (
      !node.callee ||
      node.callee.type !== "MemberExpression"
    ) {
      return;
    }

    const pushTarget =
      node.callee.object;

    if (
      !pushTarget ||
      pushTarget.type !== "MemberExpression" ||
      !pushTarget.computed
    ) {
      return;
    }

    const signature =
      getComputedAccessSignature(pushTarget);

    if (!signature) {
      return;
    }

    if (
      safeInitializations.has(signature)
    ) {
      return;
    }

    detections.push({
      type: "MISSING_HASHMAP_EXISTENCE_CHECK",

      severity: "error",

      message:
        `Possible access to uninitialized key "${signature}".`,

      explanation:
        "The key may not exist before accessing or mutating its value, which can cause runtime errors.",

      suggestion:
        `Initialize "${signature}" before use.`,

      metadata: {
        key: signature
      }
    });

  });

  return detections;
}