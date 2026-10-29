/*
  Prototype behaviour: validation with GOV.UK-style error messages, conditional
  questions, routing between pages and a check your answers page.
  Answers are kept in sessionStorage, so they stay in this browser tab only.
*/
(function () {
  "use strict";

  var rootLink = document.getElementById("proto-root");
  var root = rootLink ? rootLink.getAttribute("href") : "/";
  var STORE_KEY = "proto-answers:" + root;

  // ?preview=1 shows a clean page for the case study, ?preview=errors also shows its errors.
  // Previews never read or change the answers of someone trying the prototype.
  var preview = new URLSearchParams(location.search).get("preview");

  // Storage can be blocked (private windows, strict settings), so fall back to memory
  var memory = {};
  function load() {
    if (preview) return {};
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {}; } catch (e) { return memory; }
  }
  function save(answers) {
    memory = answers;
    if (preview) return;
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(answers)); } catch (e) { /* memory only */ }
  }

  var answers = load();

  // "reason=moved" or "reason!=moved", checked against saved answers
  function matches(condition) {
    if (!condition) return true;
    return condition.split("&").every(function (part) {
      var negate = part.indexOf("!=") > -1;
      var bits = part.split(negate ? "!=" : "=");
      var values = bits[1].split("|");
      var found = values.indexOf(answers[bits[0]] || "") > -1;
      return negate ? !found : found;
    });
  }

  // Wording that changes with an earlier answer, for example
  // "When did you move in?" for people who have always lived alone
  document.querySelectorAll("[data-alt-when]").forEach(function (el) {
    if (!matches(el.getAttribute("data-alt-when"))) return;
    var field = el.querySelector("[data-validate]") || el;
    ["label", "required"].forEach(function (key) {
      var alt = el.getAttribute("data-alt-" + key);
      if (alt) field.setAttribute("data-" + key, alt);
    });
    var heading = el.getAttribute("data-alt-heading");
    var target = el.querySelector("[data-heading]");
    if (heading && target) {
      target.textContent = heading;
      document.title = document.title.replace(/^[^–]+/, heading + " ");
    }
  });

  document.querySelectorAll("[data-show-if]").forEach(function (el) {
    el.hidden = !matches(el.getAttribute("data-show-if"));
  });

  /* ---------- Showing answers (check your answers, confirmation) ---------- */

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  function formatDate(name) {
    var d = parseInt(answers[name + "-day"], 10);
    var m = parseInt(answers[name + "-month"], 10);
    var y = answers[name + "-year"];
    if (!d || !m || !y) return "";
    return d + " " + MONTHS[m - 1] + " " + y;
  }

  document.querySelectorAll("[data-answer]").forEach(function (el) {
    var name = el.getAttribute("data-answer");
    var format = el.getAttribute("data-format");
    var value;
    if (format === "date") value = formatDate(name);
    else if (format === "lines") {
      el.textContent = "";
      name.split(",").forEach(function (key) {
        if (!answers[key]) return;
        if (el.childNodes.length) el.appendChild(document.createElement("br"));
        el.appendChild(document.createTextNode(answers[key]));
      });
      if (!el.childNodes.length) el.textContent = el.getAttribute("data-empty") || "Not given";
      return;
    } else value = answers[name + "__label"] || answers[name];
    el.textContent = value || el.getAttribute("data-empty") || "Not given";
  });

  // A reference number for the confirmation page, made once per application
  var refEl = document.querySelector("[data-reference]");
  if (refEl) {
    if (!answers.reference) {
      answers.reference = "SPD-" + String(Math.floor(100000 + Math.random() * 900000));
      save(answers);
    }
    refEl.textContent = answers.reference;
  }

  document.querySelectorAll("[data-clear-answers]").forEach(function (link) {
    link.addEventListener("click", function () { save({}); });
  });

  // Back goes to the page people actually came from, which depends on their route
  var back = document.querySelector(".p-back");
  if (back && document.referrer.indexOf(location.origin + root) === 0) {
    back.addEventListener("click", function (event) {
      event.preventDefault();
      history.back();
    });
  }

  /* ---------- Question pages ---------- */

  var form = document.querySelector(".proto-form");
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var changing = params.get("change") === "1";

  // Fill in previous answers, so Back and Change links show what people entered
  Array.prototype.forEach.call(form.elements, function (field) {
    if (!field.name || !(field.name in answers)) return;
    if (field.type === "radio") field.checked = answers[field.name] === field.value;
    else if (field.type === "checkbox") field.checked = answers[field.name] === field.value;
    else field.value = answers[field.name];
  });

  // Conditional questions inside radios
  function updateReveals() {
    form.querySelectorAll("input[type=radio][data-reveals]").forEach(function (radio) {
      var panel = document.getElementById(radio.getAttribute("data-reveals"));
      if (!panel) return;
      panel.hidden = !radio.checked;
    });
  }
  form.addEventListener("change", updateReveals);
  updateReveals();

  function isSkipped(el) {
    if (el.closest("[data-conditional][hidden]")) return true;
    var wrapper = el.closest("[data-skip-if-checked]");
    if (wrapper) {
      var box = document.getElementById(wrapper.getAttribute("data-skip-if-checked"));
      if (box && box.checked) return true;
    }
    return false;
  }

  var CHECKS = {
    postcode: function (v) { return /^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/i.test(v); },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); },
    phone: function (v) { return /^[0-9 +()-]+$/.test(v) && v.replace(/\D/g, "").length >= 10; },
    digits: function (v) { return /^[0-9 ]+$/.test(v); }
  };

  function joinParts(parts) {
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }

  // Returns { message, target } or null
  function validate(el) {
    var kind = el.getAttribute("data-validate");
    var required = el.getAttribute("data-required");

    if (kind === "radios") {
      var radios = el.querySelectorAll("input[type=radio]");
      var picked = Array.prototype.some.call(radios, function (r) { return r.checked; });
      if (!picked && required) return { message: required, target: radios[0] };
      return null;
    }

    if (kind === "input") {
      var value = el.value.trim();
      var check = el.getAttribute("data-check");
      if (!value) return required ? { message: required, target: el } : null;
      if (check && CHECKS[check] && !CHECKS[check](value)) {
        return { message: el.getAttribute("data-check-error"), target: el };
      }
      return null;
    }

    if (kind === "date") {
      var label = el.getAttribute("data-label");
      var inputs = { day: null, month: null, year: null };
      el.querySelectorAll("[data-part]").forEach(function (i) { inputs[i.getAttribute("data-part")] = i; });
      var vals = {};
      Object.keys(inputs).forEach(function (k) { vals[k] = inputs[k].value.trim(); });
      var missing = Object.keys(inputs).filter(function (k) { return !vals[k]; });

      if (missing.length === 3) return required ? { message: required, target: inputs.day, all: true } : null;
      if (missing.length) {
        return {
          message: label + " must include a " + joinParts(missing),
          target: inputs[missing[0]],
          parts: missing.map(function (k) { return inputs[k]; })
        };
      }
      var d = Number(vals.day), m = Number(vals.month), y = Number(vals.year);
      var date = new Date(y, m - 1, d);
      var real = /^\d+$/.test(vals.day + vals.month + vals.year) && vals.year.length === 4 &&
        date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
      if (!real) return { message: label + " must be a real date", target: inputs.day, all: true };
      if (el.hasAttribute("data-past") && date > new Date()) {
        return { message: label + " must be today or in the past", target: inputs.day, all: true };
      }
      return null;
    }
    return null;
  }

  function clearErrors() {
    var summary = document.querySelector(".p-error-summary");
    if (summary) summary.remove();
    form.querySelectorAll(".p-error-message").forEach(function (m) { m.remove(); });
    form.querySelectorAll(".p-form-group--error").forEach(function (g) { g.classList.remove("p-form-group--error"); });
    form.querySelectorAll(".p-input--error").forEach(function (i) {
      i.classList.remove("p-input--error");
      i.removeAttribute("aria-invalid");
    });
    form.querySelectorAll("[data-error-describedby]").forEach(function (el) {
      el.setAttribute("aria-describedby", el.getAttribute("data-error-describedby"));
      if (!el.getAttribute("aria-describedby")) el.removeAttribute("aria-describedby");
      el.removeAttribute("data-error-describedby");
    });
    document.title = document.title.replace(/^Error: /, "");
  }

  function showErrors(errors) {
    var summary = document.createElement("div");
    summary.className = "p-error-summary";
    summary.setAttribute("role", "alert");
    summary.setAttribute("tabindex", "-1");
    summary.innerHTML = '<h2 class="p-error-summary__title">There is a problem</h2><ul class="p-error-summary__list"></ul>';
    var list = summary.querySelector("ul");

    errors.forEach(function (error, index) {
      var el = error.el;
      var group = el.closest(".p-form-group");
      var id = (el.id || el.getAttribute("data-name") || "field-" + index) + "-error";

      var message = document.createElement("p");
      message.className = "p-error-message";
      message.id = id;
      message.innerHTML = '<span class="p-visually-hidden">Error:</span> ';
      message.appendChild(document.createTextNode(error.message));

      // Message goes after the hint, or after the label for a text input
      var hint = group.querySelector(":scope > .p-hint, :scope > .p-fieldset > .p-hint");
      var anchor = hint || group.querySelector(":scope > .p-label, :scope > .p-label-wrapper, :scope > .p-fieldset > .p-legend");
      if (el.getAttribute("data-validate") === "date") anchor = el.querySelector(":scope > .p-hint");
      anchor.insertAdjacentElement("afterend", message);
      group.classList.add("p-form-group--error");

      el.setAttribute("data-error-describedby", el.getAttribute("aria-describedby") || "");
      el.setAttribute("aria-describedby", ((el.getAttribute("aria-describedby") || "") + " " + id).trim());

      var badInputs = [];
      if (el.getAttribute("data-validate") === "input") badInputs = [el];
      else if (error.all) badInputs = Array.prototype.slice.call(el.querySelectorAll("[data-part]"));
      else if (error.parts) badInputs = error.parts;
      badInputs.forEach(function (i) {
        i.classList.add("p-input--error");
        i.setAttribute("aria-invalid", "true");
      });

      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + error.target.id;
      link.textContent = error.message;
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var legend = group.querySelector("legend, label");
        (legend || group).scrollIntoView();
        error.target.focus({ preventScroll: true });
      });
      item.appendChild(link);
      list.appendChild(item);
    });

    form.parentNode.insertBefore(summary, form.parentNode.firstChild);
    document.title = "Error: " + document.title;
    if (!preview) summary.focus();
  }

  function saveForm() {
    // Clear this page's old answers first, so an unticked box or hidden question doesn't linger
    Array.prototype.forEach.call(form.elements, function (field) {
      if (field.name) { delete answers[field.name]; delete answers[field.name + "__label"]; }
    });
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || isSkipped(field)) return;
      if (field.type === "radio") {
        if (!field.checked) return;
        answers[field.name] = field.value;
        var label = form.querySelector('label[for="' + field.id + '"]');
        if (label) answers[field.name + "__label"] = label.textContent.trim();
      } else if (field.type === "checkbox") {
        if (field.checked) answers[field.name] = field.value;
      } else if (field.value.trim()) {
        var value = field.value.trim();
        if (field.getAttribute("data-check") === "postcode") value = value.toUpperCase();
        answers[field.name] = value;
      }
    });
    save(answers);
  }

  function nextPage() {
    var route = form.getAttribute("data-route");
    if (route) {
      var rules = JSON.parse(route);
      for (var key in rules) {
        var target = rules[key][answers[key]];
        if (target) return { slug: target, branched: true };
      }
    }
    return { slug: form.getAttribute("data-next"), branched: false };
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();
    if (preview && preview !== "errors") return;

    var errors = [];
    form.querySelectorAll("[data-validate]").forEach(function (el) {
      if (isSkipped(el)) return;
      var error = validate(el);
      if (error) { error.el = el; errors.push(error); }
    });

    if (errors.length) { showErrors(errors); return; }
    if (preview) return;

    saveForm();
    var next = nextPage();
    var url = root + next.slug;
    // From check your answers, go straight back unless the answer opens new questions
    if (changing) url = next.branched ? url + "?change=1" : root + "check-answers/";
    location.href = url;
  });

  if (preview === "errors") form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
})();
