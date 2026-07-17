/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Simulated typing sandbox, rules customizer, and system hook exporter.
 * Theme: Bold Typography (Swiss-styled minimalist dark design)
 */

import React, { useState, useEffect } from 'react';
import { 
  transliterate, 
  DEFAULT_CONSONANT_RULES, 
  INDEPENDENT_VOWELS, 
  DEPENDENT_VOWELS,
  PhoneticRule 
} from './utils/phoneticEngine';
import { 
  PYTHON_HOOK_CODE, 
  CSHARP_HOOK_CODE, 
  LINUX_X11_HOOK_CODE, 
  DEBIAN_CONTROL_FILE, 
  DEBIAN_POSTINST_FILE, 
  SYSTEMD_SERVICE_FILE 
} from './utils/codeExporters';
import { 
  Keyboard, 
  Code, 
  Sparkles, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Power, 
  BookOpen, 
  Sliders, 
  FileCode,
  CheckCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EXPORT_DATA = {
  linux_x11: {
    filename: 'linux_x11_hook.py',
    code: LINUX_X11_HOOK_CODE,
    strategy: (
      <div className="space-y-1.5">
        <p className="text-neutral-400 leading-normal">
          1. Install required packages on your Debian/Ubuntu machine:
        </p>
        <pre className="bg-black/50 p-2 rounded text-neutral-300 select-all font-mono my-1 text-[11px] border border-white/5">
          sudo apt update && sudo apt install -y python3-xlib xdotool python3-pynput
        </pre>
        <p className="text-neutral-400 leading-normal">
          2. Execute the daemon directly: <code className="text-orange-500 font-bold font-mono">python3 linux_x11_hook.py</code>
        </p>
        <p className="text-neutral-400 leading-normal">
          3. Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-white font-mono text-[10px] font-bold">F12</kbd> globally to instantly switch between active Bangla transliteration and passthrough mode.
        </p>
      </div>
    )
  },
  debian_control: {
    filename: 'DEBIAN/control',
    code: DEBIAN_CONTROL_FILE,
    strategy: (
      <div className="space-y-1.5">
        <p className="text-neutral-400 leading-normal">
          1. This control file maps all vital dependencies to automate setup on any target client system.
        </p>
        <p className="text-neutral-400 leading-normal">
          2. Place this configuration in your workspace at <code className="text-white">debian-package/DEBIAN/control</code>.
        </p>
        <p className="text-neutral-400 leading-normal">
          3. When building the debian binary via <code className="text-orange-500 font-bold font-mono">dpkg-deb --build debian-package</code>, apt will enforce installation of <code className="text-white">python3-pynput</code>, <code className="text-white">python3-xlib</code>, and <code className="text-white font-mono">xdotool</code> automatically.
        </p>
      </div>
    )
  },
  debian_postinst: {
    filename: 'DEBIAN/postinst',
    code: DEBIAN_POSTINST_FILE,
    strategy: (
      <div className="space-y-1.5">
        <p className="text-neutral-400 leading-normal">
          1. The <code className="text-white">postinst</code> shell script is executed automatically after package extraction.
        </p>
        <p className="text-neutral-400 leading-normal">
          2. Save this script inside <code className="text-white">DEBIAN/postinst</code> and make it executable: <code className="text-white">chmod 755 postinst</code>.
        </p>
        <p className="text-neutral-400 leading-normal">
          3. It reloads systemd configurations and enables the background keyboard trigger capture daemon immediately.
        </p>
      </div>
    )
  },
  systemd_service: {
    filename: 'banglapro-ime.service',
    code: SYSTEMD_SERVICE_FILE,
    strategy: (
      <div className="space-y-1.5">
        <p className="text-neutral-400 leading-normal">
          1. This Systemd file defines how the service runs in the background.
        </p>
        <p className="text-neutral-400 leading-normal">
          2. It should be bundled inside your debian tree at <code className="text-white">/lib/systemd/system/banglapro-ime.service</code>.
        </p>
        <p className="text-neutral-400 leading-normal">
          3. It ensures high-performance automatic respawning, starts after graphic environment initialization, and runs headless with active display routing.
        </p>
      </div>
    )
  },
  python: {
    filename: 'python_hook_service.py',
    code: PYTHON_HOOK_CODE,
    strategy: (
      <div className="space-y-1.5">
        <p className="text-neutral-400 leading-normal">
          1. Run <code className="text-white">pip install pynput</code> on any machine.
        </p>
        <p className="text-neutral-400 leading-normal">
          2. Run the script: <code className="text-white">python python_hook_service.py</code>.
        </p>
        <p className="text-neutral-400 leading-normal">
          3. Toggle active state globally anytime by tapping <code className="text-white">F12</code>.
        </p>
      </div>
    )
  },
  csharp: {
    filename: 'Win32LowLevelHook.cs',
    code: CSHARP_HOOK_CODE,
    strategy: (
      <div className="space-y-1.5">
        <p className="text-neutral-400 leading-normal">
          1. Compile script inside Visual Studio Console App with high-privileges.
        </p>
        <p className="text-neutral-400 leading-normal">
          2. Add WinForms references. The low-level Windows keyboard hook intercepts and translates raw inputs.
        </p>
      </div>
    )
  }
};

export default function App() {
  // IME Active Mode State (Simulated System Mode)
  const [activeMode, setActiveMode] = useState<'BANGLA' | 'ENGLISH'>('BANGLA');
  
  // Rule customization state
  const [rules, setRules] = useState<PhoneticRule[]>([
    ...DEFAULT_CONSONANT_RULES
  ]);
  const [newPattern, setNewPattern] = useState('');
  const [newReplacement, setNewReplacement] = useState('');

  // Simulator typing states
  const [inputText, setInputText] = useState('ami bangla typing sikhbo');
  const [simulatedBackspaceLogs, setSimulatedBackspaceLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System hook loaded successfully.`,
    `[${new Date().toLocaleTimeString()}] Listening for low-level Linux X11/Xlib keyboard triggers.`
  ]);

  // Active Tab/View
  const [activeTab, setActiveTab] = useState<'simulator' | 'rules' | 'export'>('simulator');
  const [exportLanguage, setExportLanguage] = useState<'python' | 'csharp' | 'linux_x11' | 'debian_control' | 'debian_postinst' | 'systemd_service'>('linux_x11');
  const [copied, setCopied] = useState(false);

  // Interactive Live Transliteration logic
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    // Log real-time hook actions inside simulated IME sandbox console
    if (activeMode === 'BANGLA' && text.length > 0) {
      const lastChar = text[text.length - 1];
      if (lastChar === ' ') {
        const trimmed = text.trim();
        const words = trimmed.split(/\s+/);
        const lastWord = words[words.length - 1];
        if (lastWord && /^[a-zA-Z`]+$/.test(lastWord)) {
          const trans = transliterate(lastWord, rules);
          const timestamp = new Date().toLocaleTimeString();
          setSimulatedBackspaceLogs(prev => [
            `[${timestamp}] Spacebar triggers conversion: "${lastWord}" -> "${trans}"`,
            `[${timestamp}] Intercepted raw key input & injected backspaces: ${lastWord.length + 1}`,
            `[${timestamp}] Outputting Bangla Unicode buffer safely`,
            ...prev.slice(0, 8)
          ]);
        }
      }
    }
  };

  // Toggle Global Mode hotkey (Simulate F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        toggleIME();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode]);

  const toggleIME = () => {
    const newMode = activeMode === 'BANGLA' ? 'ENGLISH' : 'BANGLA';
    setActiveMode(newMode);
    const timestamp = new Date().toLocaleTimeString();
    setSimulatedBackspaceLogs(prev => [
      `[${timestamp}] Global Hook Mode switched to ${newMode} (F12 pressed)`,
      ...prev.slice(0, 8)
    ]);
  };

  // Add a custom transliteration rule dynamically
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern || !newReplacement) return;
    const ruleExists = rules.some(r => r.pattern === newPattern);
    if (ruleExists) {
      setRules(rules.map(r => r.pattern === newPattern ? { pattern: newPattern, replacement: newReplacement } : r));
    } else {
      setRules([{ pattern: newPattern, replacement: newReplacement }, ...rules]);
    }
    setNewPattern('');
    setNewReplacement('');
  };

  const handleRemoveRule = (pattern: string) => {
    setRules(rules.filter(r => r.pattern !== pattern));
  };

  const handleResetRules = () => {
    setRules([...DEFAULT_CONSONANT_RULES]);
  };

  // Copy code utility
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Transliterate whole current text for real-time sandbox preview block
  const getTransliteratedSandbox = () => {
    if (activeMode === 'ENGLISH') return inputText;
    
    // Split into words, process, keep spacing intact
    const wordsAndDelimiters = inputText.split(/(\s+)/);
    return wordsAndDelimiters.map(part => {
      if (/^[a-zA-Z`]+$/.test(part)) {
        return transliterate(part, rules);
      }
      return part;
    }).join('');
  };

  // Extract the very last typed phonetic word
  const getLastWord = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return '';
    const words = trimmed.split(/\s+/);
    return words[words.length - 1] || '';
  };

  return (
    <div className="bg-neutral-950 text-neutral-100 min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* System Navigation Bar */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-6 border-b border-white/10 bg-neutral-900/30 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-black text-2xl rotate-3 shadow-lg shadow-orange-600/20 text-white">
            অ
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic text-white">
            BanglaPro<span className="text-orange-500">.io</span>
          </span>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-neutral-900 p-1 rounded-lg border border-white/5 text-xs font-bold uppercase tracking-wider">
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${activeTab === 'simulator' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Sandbox</span>
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${activeTab === 'rules' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
          >
            <Sliders className="w-4 h-4" />
            <span>Rules Engine</span>
          </button>
          <button 
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${activeTab === 'export' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
          >
            <Code className="w-4 h-4" />
            <span>OS Export</span>
          </button>
        </div>

        {/* Global Trigger Info bar */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
            <div className={`w-2.5 h-2.5 rounded-full ${activeMode === 'BANGLA' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-neutral-600'}`}></div>
            <span>{activeMode === 'BANGLA' ? 'OS Hook Active' : 'Passthrough Mode'}</span>
          </div>
          <button 
            onClick={toggleIME}
            className="px-5 py-2 border-2 border-white text-white font-black text-xs rounded-full hover:bg-white hover:text-black transition-all"
          >
            PRESS F12 TO TOGGLE
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Interactive Panel */}
        <section className="lg:col-span-8 flex flex-col justify-center px-6 md:px-12 py-8 lg:py-0 border-r border-white/5 relative bg-[radial-gradient(circle_at_20%_30%,#1e1e1e_0%,#0a0a0a_100%)] min-h-[500px]">
          
          <div className="absolute top-6 left-6 md:left-12 flex items-center gap-2 opacity-30">
            <div className="h-[1px] w-12 bg-white"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Real-time Pipeline</span>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'simulator' && (
              <motion.div
                key="simulator-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8 mt-4"
              >
                {/* Real-time Giant visual layout mapping */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-orange-500 font-mono text-xs tracking-[0.3em] uppercase font-bold opacity-80">
                      Input Buffer (English word)
                    </div>
                    <h1 className="text-5xl md:text-8xl lg:text-[110px] font-black leading-[0.85] tracking-tighter italic text-white/15 break-all select-none">
                      {getLastWord() || 'typing'}
                      <span className="text-orange-600 animate-pulse">|</span>
                    </h1>
                  </div>

                  <div className="space-y-2">
                    <div className="text-emerald-500 font-mono text-xs tracking-[0.3em] uppercase font-bold opacity-80">
                      Phonetic Conversion (Bangla Output)
                    </div>
                    <h2 className="text-6xl md:text-9xl lg:text-[130px] font-black leading-[0.85] tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(255,255,255,0.15)] break-all">
                      {getLastWord() ? transliterate(getLastWord(), rules) : 'বাংলা'}
                    </h2>
                  </div>
                </div>

                {/* Sandbox Typing Field */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2 font-mono">
                      TEST TYPE IN SANDBOX BELOW (USE SPACEBAR TO TRIGGER WORD TRANSLATION)
                    </label>
                    <textarea
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder="e.g., ami bangla bhasay type kori..."
                      className="w-full bg-neutral-900/60 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-base font-mono resize-none h-24"
                    />
                  </div>

                  {/* Complete transliterated paragraph display block */}
                  <div className="p-4 bg-neutral-950/60 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Paragraph View Output</span>
                    <p className="text-lg font-medium text-white/90 whitespace-pre-wrap min-h-6">
                      {getTransliteratedSandbox() || <span className="text-neutral-600 italic text-sm">Converted sentences will build here...</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'rules' && (
              <motion.div
                key="rules-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6 mt-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">Active Phonetic Mappings</h3>
                  <p className="text-neutral-400 text-xs mt-1">Configure and add custom Avro patterns instantly inside the database module.</p>
                </div>

                {/* Add Custom Pattern Block */}
                <form onSubmit={handleAddRule} className="bg-neutral-900/60 p-4 rounded-xl border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-widest">English Input Trigger</label>
                    <input
                      type="text"
                      required
                      value={newPattern}
                      onChange={(e) => setNewPattern(e.target.value)}
                      placeholder="e.g., kkh"
                      className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-widest">Bangla Character</label>
                    <input
                      type="text"
                      required
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      placeholder="e.g., ক্ষ"
                      className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono text-white"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-black py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    Save Rule
                  </button>
                </form>

                {/* Rules List Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="bg-neutral-900/40 p-2.5 rounded-lg border border-white/5 flex items-center justify-between group">
                      <div className="font-mono text-xs flex items-center space-x-2">
                        <span className="text-neutral-400 font-bold">{rule.pattern}</span>
                        <span className="text-neutral-600">→</span>
                        <span className="text-emerald-400 font-black text-sm">{rule.replacement}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveRule(rule.pattern)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleResetRules}
                    className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 font-mono transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Default Bangla Table
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div
                key="export-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6 mt-4"
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">OS Hooks & Packager</h3>
                    <p className="text-neutral-400 text-xs mt-0.5">Use low-level system call wrappers and Debian release automation configs.</p>
                  </div>

                  {/* Export targets tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-neutral-900/60 p-1 rounded-lg border border-white/5 text-[10px] font-mono">
                    <button 
                      onClick={() => setExportLanguage('linux_x11')}
                      className={`px-2.5 py-1.5 rounded transition-all font-bold ${exportLanguage === 'linux_x11' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      🐧 Linux X11
                    </button>
                    <button 
                      onClick={() => setExportLanguage('debian_control')}
                      className={`px-2.5 py-1.5 rounded transition-all font-bold ${exportLanguage === 'debian_control' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      📦 control
                    </button>
                    <button 
                      onClick={() => setExportLanguage('debian_postinst')}
                      className={`px-2.5 py-1.5 rounded transition-all font-bold ${exportLanguage === 'debian_postinst' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      ⚙️ postinst
                    </button>
                    <button 
                      onClick={() => setExportLanguage('systemd_service')}
                      className={`px-2.5 py-1.5 rounded transition-all font-bold ${exportLanguage === 'systemd_service' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      ⚡ systemd
                    </button>
                    <button 
                      onClick={() => setExportLanguage('python')}
                      className={`px-2.5 py-1.5 rounded transition-all font-bold ${exportLanguage === 'python' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      🐍 Python
                    </button>
                    <button 
                      onClick={() => setExportLanguage('csharp')}
                      className={`px-2.5 py-1.5 rounded transition-all font-bold ${exportLanguage === 'csharp' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      🪟 C# Win
                    </button>
                  </div>
                </div>

                {/* Code Terminal View */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      {EXPORT_DATA[exportLanguage]?.filename}
                    </span>
                    <button
                      onClick={() => handleCopyCode(EXPORT_DATA[exportLanguage]?.code || '')}
                      className="px-3 py-1 text-xs bg-neutral-900 border border-white/10 rounded hover:bg-neutral-800 text-white transition-all flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <pre className="overflow-x-auto text-[11px] font-mono p-4 bg-black border border-white/5 rounded-lg text-neutral-300 max-h-72">
                    <code>{EXPORT_DATA[exportLanguage]?.code}</code>
                  </pre>
                </div>

                <div className="p-4 bg-neutral-900/40 rounded-xl border border-white/5 text-xs font-mono space-y-2">
                  <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                    Execution & Rollout Strategy:
                  </div>
                  {EXPORT_DATA[exportLanguage]?.strategy}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

        {/* Right Sidebar: Dynamic mappings list & Engine monitoring details */}
        <aside className="lg:col-span-4 bg-black/40 backdrop-blur-xl p-8 md:p-10 flex flex-col justify-between border-t lg:border-t-0 border-white/5">
          
          <div className="space-y-8">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] flex items-center gap-3">
              Phonetic Previews <div className="flex-1 h-[1px] bg-white/10"></div>
            </h3>

            {/* Quick Interactive list representing rules list */}
            <div className="space-y-6">
              <div className="flex items-end justify-between group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white/30 uppercase tracking-tighter mb-1 font-mono">English Key</span>
                  <span className="text-2xl font-black italic group-hover:text-orange-500 transition-colors">ami</span>
                </div>
                <span className="text-3xl font-black text-white">আমি</span>
              </div>

              <div className="flex items-end justify-between group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white/30 uppercase tracking-tighter mb-1 font-mono">English Key</span>
                  <span className="text-2xl font-black italic group-hover:text-orange-500 transition-colors">bangla</span>
                </div>
                <span className="text-3xl font-black text-white">বাংলা</span>
              </div>

              <div className="flex items-end justify-between group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white/30 uppercase tracking-tighter mb-1 font-mono">English Key</span>
                  <span className="text-2xl font-black italic group-hover:text-orange-500 transition-colors">gaan</span>
                </div>
                <span className="text-3xl font-black text-white">গান</span>
              </div>
            </div>

            {/* Low-Level Buffer Logs Terminal widget */}
            <div className="space-y-3 pt-6 border-t border-white/5">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] block">
                Hook Event Telemetry
              </span>
              <div className="p-3 bg-neutral-900 border border-white/5 rounded-lg font-mono text-[11px] text-neutral-400 space-y-1.5 max-h-36 overflow-y-auto">
                {simulatedBackspaceLogs.map((log, index) => (
                  <div key={index} className="text-neutral-400 border-b border-white/5 pb-1 last:border-0">
                    <span className="text-orange-500">▶</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Engine Status Card */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-white/5 mt-8">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest font-mono">Engine V3.2</span>
              <span className="text-[10px] font-mono text-white/40 italic">0.002ms delay</span>
            </div>
            <p className="text-xs leading-relaxed text-white/60">
              Low-level system hook runs asynchronously on a dedicated Windows keyboard callback message loop thread, ensuring zero keyboard input latency.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 p-2 rounded text-center">
                <div className="text-[8px] uppercase text-white/30 tracking-widest font-mono">Platform</div>
                <div className="text-[10px] font-bold mt-0.5 text-white">Win32 / macOS</div>
              </div>
              <div className="bg-white/5 p-2 rounded text-center">
                <div className="text-[8px] uppercase text-white/30 tracking-widest font-mono">Dictionary</div>
                <div className="text-[10px] font-bold mt-0.5 text-white">Standard Avro</div>
              </div>
            </div>
          </div>

        </aside>

      </main>

      {/* System Tray Footer */}
      <footer className="h-14 bg-neutral-950 border-t border-white/5 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono text-neutral-400 py-3 md:py-0">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/20 uppercase">Mode</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${activeMode === 'BANGLA' ? 'text-emerald-500' : 'text-orange-500'}`}>
              {activeMode === 'BANGLA' ? 'Bangla (Active)' : 'English (Passthrough)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/20 uppercase">Global Trigger Key</span>
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">F12</span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-white/20 tracking-tighter italic">
          Open Source Modular IME Implementation for OS-Level Input Methods
        </div>
      </footer>
    </div>
  );
}
