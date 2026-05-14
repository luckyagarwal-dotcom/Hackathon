/*
==================================================
LogicLens Phase 2
Realtime Editor Detection + Code Tracking System
==================================================

This is the foundational architecture for:
- Monaco tracking
- Ace tracking
- CodeMirror tracking
- Textarea tracking

Future:
- AST parsing
- Visualization
- Mentor system
- AI explanations

IMPORTANT:
This file is intentionally modular.
We are simulating adapter architecture even in one file.
*/

/* ==================================================
   GLOBAL STATE
================================================== */

const LogicLens = {
  currentEditor: null,
  currentEditorType: null,
  trackingInterval: null,
  observer: null,
  lastCode: "",
  routeCheckInterval: null,
  lastUrl: location.href
};

/* ==================================================
   PLATFORM DETECTION
================================================== */

const SUPPORTED_PLATFORMS = [
  "leetcode.com",
  "hackerrank.com",
  "geeksforgeeks.org",
  "codeforces.com",
  "codechef.com",
  "atcoder.jp"
];

function isSupportedPlatform() {
  return SUPPORTED_PLATFORMS.some(platform =>
    window.location.hostname.includes(platform)
  );
}

/* ==================================================
   BADGE SYSTEM
================================================== */

function createBadge() {

  if (document.getElementById("logiclens-badge")) {
    return;
  }

  const badge = document.createElement("div");

  badge.id = "logiclens-badge";

  badge.innerHTML = `
    <div class="logiclens-dot"></div>
    <span id="logiclens-status">
      LogicLens Active
    </span>
  `;

  document.body.appendChild(badge);
}

function updateBadge(text) {

  const status = document.getElementById("logiclens-status");

  if (status) {
    status.textContent = text;
  }
}

/* ==================================================
   LOGGING SYSTEM
================================================== */

function log(message, data = "") {

  console.log(
    `%cLogicLens%c ${message}`,
    "color:#4f8cff;font-weight:bold;",
    "color:white;",
    data
  );
}

/* ==================================================
   DEBOUNCE UTILITY
================================================== */

function debounce(fn, delay = 300) {

  let timeout;

  return (...args) => {

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      fn(...args);
    }, delay);

  };
}

/* ==================================================
   EDITOR ADAPTERS
================================================== */

/*
==================================================
MONACO ADAPTER
==================================================
*/

const MonacoAdapter = {

  detect() {

    return (
      document.querySelector(".monaco-editor") ||
      document.querySelector(".view-lines") ||
      window.monaco
    );
  },

  getCode() {

    try {

      /*
      ==========================================
      Preferred Method:
      Monaco Model API
      ==========================================
      */

      if (
        window.monaco &&
        window.monaco.editor &&
        window.monaco.editor.getModels
      ) {

        const models = window.monaco.editor.getModels();

        if (models.length > 0) {
          return models[0].getValue();
        }
      }

      /*
      ==========================================
      Fallback:
      DOM Extraction
      ==========================================
      */

      const viewLines = document.querySelector(".view-lines");

      if (viewLines) {
        return viewLines.innerText;
      }

      return "";

    } catch (error) {

      log("Monaco extraction failed", error);

      return "";
    }
  },

  startTracking() {

    updateBadge("Tracking Code");

    log("Tracking started: Monaco");

    startRealtimeTracking(this);
  }
};

/*
==================================================
ACE ADAPTER
==================================================
*/

const AceAdapter = {

  detect() {

    return document.querySelector(".ace_editor");
  },

  getCode() {

    try {

      const aceEditor = document.querySelector(".ace_editor");

      if (!aceEditor) {
        return "";
      }

      /*
      ==========================================
      Ace stores text in layer content
      ==========================================
      */

      return aceEditor.innerText;

    } catch (error) {

      log("Ace extraction failed", error);

      return "";
    }
  },

  startTracking() {

    updateBadge("Tracking Code");

    log("Tracking started: Ace");

    startRealtimeTracking(this);
  }
};

/*
==================================================
CODEMIRROR ADAPTER
==================================================
*/

const CodeMirrorAdapter = {

  detect() {

    return (
      document.querySelector(".cm-editor") ||
      document.querySelector(".CodeMirror")
    );
  },

  getCode() {

    try {

      const cmEditor =
        document.querySelector(".cm-editor") ||
        document.querySelector(".CodeMirror");

      if (!cmEditor) {
        return "";
      }

      return cmEditor.innerText;

    } catch (error) {

      log("CodeMirror extraction failed", error);

      return "";
    }
  },

  startTracking() {

    updateBadge("Tracking Code");

    log("Tracking started: CodeMirror");

    startRealtimeTracking(this);
  }
};

/*
==================================================
TEXTAREA ADAPTER
==================================================
*/

const TextareaAdapter = {

  detect() {

    return document.querySelector("textarea");
  },

  getCode() {

    try {

      const textarea =
        document.querySelector("textarea");

      return textarea?.value || "";

    } catch (error) {

      log("Textarea extraction failed", error);

      return "";
    }
  },

  startTracking() {

    updateBadge("Tracking Code");

    log("Tracking started: Textarea");

    startRealtimeTracking(this);
  }
};

/* ==================================================
   ADAPTER REGISTRY
================================================== */

const EditorAdapters = [
  MonacoAdapter,
  AceAdapter,
  CodeMirrorAdapter,
  TextareaAdapter
];

/* ==================================================
   REALTIME TRACKING ENGINE
================================================== */
function detectProgrammingLanguage() {

  const selectors = [
    '[data-cy="lang-select"]',
    '.lang-select',
    'button'
  ];

  for (const selector of selectors) {

    const elements =
      document.querySelectorAll(selector);

    for (const element of elements) {

      const text =
        element.innerText.toLowerCase();

      if (text.includes("javascript")) {
        return "javascript";
      }

      if (text.includes("python")) {
        return "python";
      }

      if (text.includes("java")) {
        return "java";
      }

      if (text.includes("c++")) {
        return "cpp";
      }

      if (text === "c") {
        return "c";
      }
    }
  }

  return "unknown";
}

const handleCodeUpdate = debounce((code) => {

  if (!code) {
    return;
  }

  if (code === LogicLens.lastCode) {
    return;
  }

  LogicLens.lastCode = code;

  log("Code updated");

  console.log(
    "%cCURRENT CODE:",
    "color:#00e676;font-weight:bold;",
    code
  );

  /*
  ==========================================
  AST PARSING ENGINE
  ==========================================
  */

code = code
  .replace(/⌄/g, "")
  .replace(/^\d+$/gm, "")
  .trim();

const language = detectProgrammingLanguage();

console.log(
  "%cDetected Language:",
  "color:#03a9f4;font-weight:bold;",
  language
);

let ast = null;

if (language === "javascript") {

  ast = parseJavaScript(code);

} else if (language === "java") {

  ast = parseJava(code);

} else if (language === "python") {

  ast = parsePython(code);

}

console.log(
  "%cAST RESULT:",
  "color:#ff9800;font-weight:bold;",
  ast
);
const offByOneResults =
  detectOffByOne(ast);

const binarySearchMidResults =
  detectBinarySearchMidOverflow(ast);

const divisionByZeroResults =
  detectDivisionByZeroRisk(ast);

const incorrectLoopUpdateResults =
  detectIncorrectLoopUpdate(ast);

const floatingPointResults =
  detectFloatingPointEqualityRisk(ast);

const hashMapResults =
  detectMissingHashMapExistenceCheck(ast);

offByOneResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);

const infiniteLoopResults =
  detectInfiniteLoop(ast);

infiniteLoopResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const recursionResults =
  detectMissingBaseCase(ast);

recursionResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const nullAccessResults =
  detectNullAccess(ast);

nullAccessResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const assignmentConditionResults =
  detectAssignmentInCondition(ast);

assignmentConditionResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const unreachableCodeResults =
  detectUnreachableCode(ast);

unreachableCodeResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const emptyLoopResults =
  detectEmptyLoopBody(ast);

emptyLoopResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const apiMisuseResults =
  detectApiMisuse(
    ast,
    language
  );

apiMisuseResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const mutationResults =
  detectArrayMutationDuringIteration(
    ast
  );

mutationResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);
const missingReturnResults =
  detectMissingReturn(ast);

missingReturnResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);

binarySearchMidResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);

divisionByZeroResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);

incorrectLoopUpdateResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);

floatingPointResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);

hashMapResults.forEach(
  (result) => {

    console.warn(
      "%cLOGICLENS DETECTION:",
      "color:#ff1744;font-weight:bold;",
      result.message
    );

    console.log(
      "%cEXPLANATION:",
      "color:#00bcd4;font-weight:bold;",
      result.explanation
    );

    console.log(
      "%cSUGGESTION:",
      "color:#8bc34a;font-weight:bold;",
      result.suggestion
    );

  }
);

}, 500);

function startRealtimeTracking(adapter) {

  /*
  ==========================================
  Prevent duplicate intervals
  ==========================================
  */

  cleanupTracking();

  LogicLens.currentEditor = adapter;

  /*
  ==========================================
  Polling strategy
  ==========================================
  */

  LogicLens.trackingInterval = setInterval(() => {

    const code = adapter.getCode();

    handleCodeUpdate(code);

  }, 1000);
}

/* ==================================================
   CLEANUP SYSTEM
================================================== */

function cleanupTracking() {

  if (LogicLens.trackingInterval) {

    clearInterval(LogicLens.trackingInterval);

    LogicLens.trackingInterval = null;
  }
}

/* ==================================================
   EDITOR DETECTION ENGINE
================================================== */

function detectEditor() {

  log("Searching for editor...");

  for (const adapter of EditorAdapters) {

    if (adapter.detect()) {

      const editorName =
        adapter === MonacoAdapter
          ? "Monaco"
          : adapter === AceAdapter
          ? "Ace"
          : adapter === CodeMirrorAdapter
          ? "CodeMirror"
          : "Textarea";

      /*
      ==========================================
      Avoid reinitializing same editor
      ==========================================
      */

      if (LogicLens.currentEditorType === editorName) {
        return;
      }

      LogicLens.currentEditorType = editorName;

      updateBadge("Editor Detected");

      log(`${editorName} detected`);

      adapter.startTracking();

      return;
    }
  }
}

/* ==================================================
   MUTATION OBSERVER
================================================== */

function startDOMObserver() {

  /*
  ==========================================
  Prevent duplicate observers
  ==========================================
  */

  if (LogicLens.observer) {
    LogicLens.observer.disconnect();
  }

  LogicLens.observer = new MutationObserver(
    debounce(() => {

      detectEditor();

    }, 500)
  );

  LogicLens.observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  log("MutationObserver attached");
}

/* ==================================================
   SPA ROUTE CHANGE HANDLING
================================================== */

function monitorRouteChanges() {

  LogicLens.routeCheckInterval = setInterval(() => {

    if (location.href !== LogicLens.lastUrl) {

      log("Route changed");

      LogicLens.lastUrl = location.href;

      LogicLens.currentEditorType = null;

      cleanupTracking();

      setTimeout(() => {

        detectEditor();

      }, 1500);
    }

  }, 1000);
}

/* ==================================================
   INITIALIZATION
================================================== */

function initializeLogicLens() {

  if (!isSupportedPlatform()) {

    log("Unsupported platform");

    return;
  }

  log("LogicLens Loaded");

  createBadge();

  detectEditor();

  startDOMObserver();

  monitorRouteChanges();
}

/* ==================================================
   START EXTENSION
================================================== */

window.addEventListener("load", () => {

  initializeLogicLens();

});