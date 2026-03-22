"use strict";

/** @typedef {{ name: string, description?: string }} Pref */

const MAX_RESULTS = 100;

/**
 * Pref names have no spaces; users often type "browser tabs" anyway.
 * Collapse whitespace so the query is one subsequence over the name.
 */
function compactQuery(query) {
  return query.replace(/\s+/g, "");
}

/**
 * Subsequence fuzzy score: higher is better. 0 = no match.
 * Rewards consecutive character matches and matches after ".".
 */
function fuzzyScore(query, text) {
  const q = compactQuery(query).toLowerCase();
  if (!q) return 1;
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let prev = -2;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      const streak = i === prev + 1 ? 3 : 1;
      const afterDot = i > 0 && t[i - 1] === "." ? 2 : 0;
      score += streak + afterDot;
      prev = i;
      qi++;
    }
  }
  if (qi < q.length) return 0;
  const qLen = q.length;
  const tLen = t.length;
  const density = qLen / tLen;
  return score + density * 0.01;
}

/**
 * @param {string} query
 * @param {Pref[]} prefs
 * @returns {Pref[]}
 */
function itemScore(query, p) {
  const nameS = fuzzyScore(query, p.name);
  const descS = p.description ? fuzzyScore(query, p.description) : 0;
  return Math.max(nameS, descS);
}

function rankPrefs(query, prefs) {
  const scored = prefs
    .map((p) => ({
      pref: p,
      score: itemScore(query, p),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.pref.name.localeCompare(b.pref.name);
    })
    .slice(0, MAX_RESULTS)
    .map((x) => x.pref);

  if (!query.trim()) {
    return [...prefs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, MAX_RESULTS);
  }
  return scored;
}

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function renderResults(prefs, query) {
  const list = document.getElementById("results");
  const status = document.getElementById("status");
  list.innerHTML = "";

  if (prefs.length === 0) {
    status.hidden = false;
    status.classList.remove("status--error");
    const msg = query.trim() ? "No matches." : "No entries in prefs.json.";
    status.textContent = msg;
    const empty = el("div", "empty", msg);
    list.appendChild(empty);
    return;
  }

  for (const p of prefs) {
    const li = el("li", "result");
    const nameP = el("p", "result__name", p.name);
    li.appendChild(nameP);

    const copyBtn = el("button", "btn", "Copy");
    copyBtn.type = "button";
    copyBtn.addEventListener("click", () => copyName(p.name));

    const openBtn = el("button", "btn", "Open");
    openBtn.type = "button";
    openBtn.title = "Open about:config";
    openBtn.addEventListener("click", () => openAboutConfig());

    li.appendChild(copyBtn);
    li.appendChild(openBtn);

    if (p.description) {
      const desc = el("p", "result__desc", p.description);
      li.appendChild(desc);
    }

    list.appendChild(li);
  }

  status.hidden = false;
  status.classList.remove("status--error");
  status.textContent =
    prefs.length >= MAX_RESULTS
      ? `Showing first ${MAX_RESULTS} results. Refine your search.`
      : `${prefs.length} result${prefs.length === 1 ? "" : "s"}`;
}

async function copyName(name) {
  const status = document.getElementById("status");
  try {
    await navigator.clipboard.writeText(name);
    status.hidden = false;
    status.classList.remove("status--error");
    status.textContent = `Copied: ${name}`;
  } catch (e) {
    status.hidden = false;
    status.classList.add("status--error");
    status.textContent = "Could not copy to clipboard.";
  }
}

function openAboutConfig() {
  browser.tabs.create({ url: "about:config" });
}

async function main() {
  const search = document.getElementById("search");
  const status = document.getElementById("status");
  let prefs = [];

  try {
    const url = browser.runtime.getURL("data/prefs.json");
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid prefs format");
    prefs = data.filter(
      (x) => x && typeof x.name === "string" && x.name.trim() !== ""
    );
  } catch (e) {
    status.hidden = false;
    status.classList.add("status--error");
    status.textContent = "Could not load data/prefs.json.";
    renderResults([], "");
    return;
  }

  function refresh() {
    const q = search.value;
    const ranked = rankPrefs(q, prefs);
    renderResults(ranked, q);
  }

  search.addEventListener("input", refresh);
  refresh();
}

document.addEventListener("DOMContentLoaded", main);
