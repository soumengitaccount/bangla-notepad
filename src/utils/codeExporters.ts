/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Code Exporters for Python, C#, and Linux Debian X11 hooking environments.
 */

export const PYTHON_HOOK_CODE = `import sys
import time
import threading
from pynput import keyboard
from pynput.keyboard import Controller, Key

# --- PHONETIC ENGINE DEFINITION ---
CONSONANTS = set(['k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'f', 'b', 'v', 'm', 'z', 'r', 'l', 's', 'h', 'w', 'y', 'x', 'q'])

INDEPENDENT_VOWELS = {
    'a': 'অ', 'A': 'আ', 'i': 'ই', 'I': 'ঈ', 'u': 'উ', 'U': 'ঊ', 'e': 'এ', 'o': 'ও', 'O': 'ও',
    'oi': 'ঐ', 'ou': 'ঔ', 'rri': 'ঋ'
}

DEPENDENT_VOWELS = {
    'a': 'া', 'i': 'ি', 'I': 'ী', 'u': 'ু', 'U': 'ূ', 'e': 'ে', 'o': 'ো', 'oi': 'ৈ', 'ou': 'ৌ', 'rri': 'ৃ'
}

CONSONANT_RULES = [
    ('kh', 'খ'), ('gh', 'ঘ'), ('ch', 'ছ'), ('jh', 'ঝ'), ('Th', 'ঠ'), ('Dh', 'ঢ'),
    ('th', 'থ'), ('dh', 'ধ'), ('ph', 'ফ'), ('bh', 'ভ'), ('sh', 'শ'), ('Sh', 'ষ'),
    ('Ng', 'ঙ'), ('ng', 'ং'), ('Y', 'ঞ'), ('Rh', 'ঢ়'), ('R', 'ড়'), ('t\`', 'ৎ'),
    ('k', 'ক'), ('g', 'গ'), ('c', 'চ'), ('j', 'জ'), ('T', 'ট'), ('D', 'ড'),
    ('t', 'ত'), ('d', 'দ'), ('n', 'ন'), ('p', 'প'), ('f', 'ফ'), ('b', 'ব'),
    ('v', 'ভ'), ('m', 'ম'), ('z', 'য'), ('r', 'র'), ('l', 'ল'), ('s', 'স'),
    ('h', 'হ'), ('N', 'ণ'), ('w', 'ও'), ('y', 'য়'), ('x', 'ক্স'), ('q', 'ক')
]

def transliterate(text):
    if not text:
        return ""
    result = ""
    i = 0
    n = len(text)
    while i < n:
        # Check vowels
        vowel_match = None
        vowel_len = 0
        for length in [3, 2, 1]:
            if i + length <= n:
                sub = text[i:i+length]
                if sub in INDEPENDENT_VOWELS:
                    vowel_match = sub
                    vowel_len = length
                    break
        
        if vowel_match:
            prev_char = text[i-1].lower() if i > 0 else ""
            has_consonant_prev = prev_char and (
                prev_char in CONSONANTS or 
                (prev_char == 'h' and i > 1 and text[i-2].lower() in CONSONANTS)
            )
            if has_consonant_prev:
                result += DEPENDENT_VOWELS.get(vowel_match, INDEPENDENT_VOWELS[vowel_match])
            else:
                result += INDEPENDENT_VOWELS[vowel_match]
            i += vowel_len
            continue

        # Check consonants
        match_found = False
        for pattern, replacement in CONSONANT_RULES:
            length = len(pattern)
            if i + length <= n and text[i:i+length] == pattern:
                if len(result) > 0 and i > 0:
                    prev_input_char = text[i-1].lower()
                    is_current_consonant = pattern[0].lower() in CONSONANTS
                    is_prev_consonant = prev_input_char in CONSONANTS
                    if is_prev_consonant and is_current_consonant:
                        result += '্' # Hasant for conjunct
                result += replacement
                i += length
                match_found = True
                break
        
        if not match_found:
            result += text[i]
            i += 1
            
    return result


# --- GLOBAL SYSTEM HOOK STATE ---
keyboard_controller = Controller()
input_buffer = []
active_mode = "BANGLA"  # Options: BANGLA, ENGLISH
lock = threading.Lock()

def on_press(key):
    global active_mode, input_buffer
    
    # Toggle Hotkey: F12
    if key == Key.f12:
        with lock:
            active_mode = "ENGLISH" if active_mode == "BANGLA" else "BANGLA"
            input_buffer.clear()
            print(f"\\n[IME] Switched mode to: {active_mode}\\n")
        return

    if active_mode == "ENGLISH":
        return

    try:
        # Handle alphabetical keystrokes
        if hasattr(key, 'char') and key.char is not None:
            char = key.char
            
            # If it's a typing letter or standard phonetic trigger
            if char.isalnum() or char in ['\`']:
                with lock:
                    input_buffer.append(char)
                return
            
            # If it's a delimiter/space, trigger backspace substitution
            if char == ' ' or key == Key.space:
                with lock:
                    if input_buffer:
                        english_word = "".join(input_buffer)
                        bangla_word = transliterate(english_word)
                        
                        # Automated backspacing to remove English text
                        # Backspace input length + 1 (for the space character itself)
                        # We send backspace actions programmatically
                        backspaces = len(english_word) + 1
                        for _ in range(backspaces):
                            keyboard_controller.tap(Key.backspace)
                            time.sleep(0.01) # Short delay to prevent OS buffer collision
                        
                        # Type Bangla word and add the space back
                        keyboard_controller.type(bangla_word + ' ')
                        input_buffer.clear()
                        # Suppress duplicate keys
                        return
                    
        # Reset buffer on navigation or action keys
        if key in [Key.enter, Key.tab, Key.backspace, Key.esc, Key.left, Key.right, Key.up, Key.down]:
            with lock:
                if key == Key.backspace and input_buffer:
                    input_buffer.pop()
                else:
                    input_buffer.clear()

    except Exception as e:
        print(f"Error handling key: {e}")

def run_listener():
    print("==============================================")
    print("  Bangla Phonetic IME Listener Active (pynput)")
    print("  Press [F12] to toggle BANGLA <-> ENGLISH")
    print("  Type in phonetic English (e.g., 'ami bangla')")
    print("==============================================")
    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()

if __name__ == "__main__":
    run_listener()
`;

export const CSHARP_HOOK_CODE = `using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

namespace BanglaPhoneticIME
{
    class Program
    {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private static LowLevelKeyboardProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;

        // IME State variables
        private static bool isBanglaMode = true;
        private static StringBuilder inputBuffer = new StringBuilder();
        
        // Setup WinAPI Imports for low level keyboard intercepting
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        static void Main(string[] args)
        {
            Console.WriteLine("====================================================");
            Console.WriteLine("  Bangla OS Keyboard Hook Service Running (WinAPI) ");
            Console.WriteLine("  Press [F12] to toggle BANGLA <-> ENGLISH");
            Console.WriteLine("  Type in any active window (Notepad, Chrome, etc.) ");
            Console.WriteLine("====================================================");

            _hookID = SetHook(_proc);
            Application.Run();
            UnhookWindowsHookEx(_hookID);
        }

        private static IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN)
            {
                int vkCode = Marshal.ReadInt32(lParam);
                Keys key = (Keys)vkCode;

                // Toggle logic on F12
                if (key == Keys.F12)
                {
                    isBanglaMode = !isBanglaMode;
                    inputBuffer.Clear();
                    Console.WriteLine("\\n[IME] Toggled. Current Mode: " + (isBanglaMode ? "BANGLA" : "ENGLISH"));
                    return CallNextHookEx(_hookID, nCode, wParam, lParam);
                }

                if (isBanglaMode)
                {
                    // If alphanumeric or a dynamic backtick trigger
                    if ((vkCode >= 65 && vkCode <= 90) || (vkCode >= 48 && vkCode <= 57) || key == Keys.Oemtilde)
                    {
                        char inputChar = GetCharFromKey(key);
                        if (inputChar != '\\0')
                        {
                            inputBuffer.Append(inputChar);
                        }
                    }
                    // Handle buffer translation on Space key trigger
                    else if (key == Keys.Space)
                    {
                        if (inputBuffer.Length > 0)
                        {
                            string englishWord = inputBuffer.ToString();
                            string banglaWord = Transliterate(englishWord);

                            // Send backspaces to clear original English word
                            // Plus 1 for the space character
                            int backspaceCount = englishWord.Length + 1;
                            
                            // Send simulated keyboard inputs
                            SendBackspacesAndText(backspaceCount, banglaWord + " ");
                            
                            inputBuffer.Clear();
                            return (IntPtr)1; // Consume keypress to avoid duplicate input
                        }
                    }
                    else if (key == Keys.Back)
                    {
                        if (inputBuffer.Length > 0)
                        {
                            inputBuffer.Remove(inputBuffer.Length - 1, 1);
                        }
                    }
                    else if (key == Keys.Enter || key == Keys.Tab || key == Keys.Escape || key == Keys.Left || key == Keys.Right)
                    {
                        inputBuffer.Clear();
                    }
                }
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }

        private static char GetCharFromKey(Keys key)
        {
            // Simple mapping for representation
            string keyStr = key.ToString().ToLower();
            if (keyStr.Length == 1) return keyStr[0];
            if (key == Keys.Oemtilde) return '\`';
            return '\\0';
        }

        private static void SendBackspacesAndText(int backspaceCount, string text)
        {
            // Send backspace events dynamically
            List<Input> inputs = new List<Input>();
            
            for (int i = 0; i < backspaceCount; i++)
            {
                inputs.Add(new Input { Type = 1, U = new InputUnion { Ki = new KeyboardInput { WVk = 0x08 } } }); // Backspace down
                inputs.Add(new Input { Type = 1, U = new InputUnion { Ki = new KeyboardInput { WVk = 0x08, DwFlags = 2 } } }); // Backspace up
            }

            // Send unicode characters
            foreach (char c in text)
            {
                inputs.Add(new Input { Type = 1, U = new InputUnion { Ki = new KeyboardInput { WScan = c, DwFlags = 4 } } }); // Unicode char
            }

            SendInput((uint)inputs.Count, inputs.ToArray(), Marshal.SizeOf(typeof(Input)));
        }

        // WinAPI structures for fast hardware-level SendInput
        [StructLayout(LayoutKind.Sequential)]
        struct Input { public uint Type; public InputUnion U; }

        [StructLayout(LayoutKind.Explicit)]
        struct InputUnion { [FieldOffset(0)] public KeyboardInput Ki; }

        [StructLayout(LayoutKind.Sequential)]
        struct KeyboardInput { public ushort WVk; public ushort WScan; public uint DwFlags; public uint Time; public IntPtr DwExtraInfo; }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint SendInput(uint nInputs, Input[] pInputs, int cbSize);

        // --- PHONETIC TRANSLITERATOR ENGINE ---
        private static readonly HashSet<char> Consonants = new HashSet<char> { 'k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'f', 'b', 'v', 'm', 'z', 'r', 'l', 's', 'h' };
        
        private static readonly Dictionary<string, string> IndependentVowels = new Dictionary<string, string>
        {
            { "a", "অ" }, { "A", "আ" }, { "i", "ই" }, { "I", "ঈ" }, { "u", "উ" }, { "U", "ঊ" }, { "e", "এ" }, { "o", "ও" }, { "O", "ও" }, { "oi", "ঐ" }, { "ou", "ঔ" }, { "rri", "ঋ" }
        };

        private static readonly Dictionary<string, string> DependentVowels = new Dictionary<string, string>
        {
            { "a", "া" }, { "i", "ি" }, { "I", "ী" }, { "u", "ু" }, { "U", "ূ" }, { "e", "ে" }, { "o", "ো" }, { "oi", "ৈ" }, { "ou", "ৌ" }, { "rri", "ৃ" }
        };

        private static readonly string[][] ConsonantRules = new string[][]
        {
            new string[] { "kh", "খ" }, new string[] { "gh", "ঘ" }, new string[] { "ch", "ছ" }, new string[] { "jh", "ঝ" },
            new string[] { "Th", "ঠ" }, new string[] { "Dh", "ঢ" }, new string[] { "th", "থ" }, new string[] { "dh", "ধ" },
            new string[] { "ph", "ফ" }, new string[] { "bh", "ভ" }, new string[] { "sh", "শ" }, new string[] { "Sh", "ষ" },
            new string[] { "Ng", "ঙ" }, new string[] { "ng", "ং" }, new string[] { "Y", "ঞ" }, new string[] { "Rh", "ঢ়" },
            new string[] { "R", "ড়" }, new string[] { "t\`", "ৎ" },
            new string[] { "k", "ক" }, new string[] { "g", "গ" }, new string[] { "c", "চ" }, new string[] { "j", "জ" },
            new string[] { "T", "ট" }, new string[] { "D", "ড" }, new string[] { "t", "ত" }, new string[] { "d", "দ" },
            new string[] { "n", "ন" }, new string[] { "p", "প" }, new string[] { "f", "ফ" }, new string[] { "b", "ব" },
            new string[] { "v", "ভ" }, new string[] { "m", "ম" }, new string[] { "z", "য" }, new string[] { "r", "র" },
            new string[] { "l", "ল" }, new string[] { "s", "স" }, new string[] { "h", "হ" }, new string[] { "N", "ণ" }
        };

        public static string Transliterate(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            StringBuilder result = new StringBuilder();
            int i = 0;
            int n = text.Length;

            while (i < n)
            {
                // Check Vowels
                string vowelMatch = null;
                int vowelLen = 0;
                int[] vowelLengths = { 3, 2, 1 };
                foreach (int len in vowelLengths)
                {
                    if (i + len <= n)
                    {
                        string sub = text.Substring(i, len);
                        if (IndependentVowels.ContainsKey(sub))
                        {
                            vowelMatch = sub;
                            vowelLen = len;
                            break;
                        }
                    }
                }

                if (vowelMatch != null)
                {
                    char prevChar = i > 0 ? char.ToLower(text[i - 1]) : '\\0';
                    bool hasConsonantPrev = prevChar != '\\0' && (Consonants.Contains(prevChar) || (prevChar == 'h' && i > 1 && Consonants.Contains(char.ToLower(text[i - 2]))));

                    if (hasConsonantPrev)
                    {
                        result.Append(DependentVowels.ContainsKey(vowelMatch) ? DependentVowels[vowelMatch] : IndependentVowels[vowelMatch]);
                    }
                    else
                    {
                        result.Append(IndependentVowels[vowelMatch]);
                    }
                    i += vowelLen;
                    continue;
                }

                // Check Consonant Rules
                bool matchFound = false;
                foreach (var rule in ConsonantRules)
                {
                    string pattern = rule[0];
                    string replacement = rule[1];
                    int len = pattern.Length;

                    if (i + len <= n && text.Substring(i, len) == pattern)
                    {
                        if (result.Length > 0 && i > 0)
                        {
                            char prevInputChar = char.ToLower(text[i - 1]);
                            bool isCurrentConsonant = Consonants.Contains(char.ToLower(pattern[0]));
                            bool isPrevConsonant = Consonants.Contains(prevInputChar);
                            if (isPrevConsonant && isCurrentConsonant)
                            {
                                result.Append('্'); // Hasant
                            }
                        }
                        result.Append(replacement);
                        i += len;
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound)
                {
                    result.Append(text[i]);
                    i++;
                }
            }

            return result;
        }
    }
}
`;

export const LINUX_X11_HOOK_CODE = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bangla Phonetic IME - Linux (Debian/Ubuntu) X11 Keyboard Hooking Daemon
Utilizes Xlib for low-level async keyboard interception & xdotool for backspacing.
"""

import sys
import time
import subprocess
import threading
from Xlib import X, display
from Xlib.ext import record
from Xlib.protocol import rq

# --- PHONETIC ENGINE ---
CONSONANTS = set(['k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'f', 'b', 'v', 'm', 'z', 'r', 'l', 's', 'h', 'w', 'y', 'x', 'q'])
INDEPENDENT_VOWELS = {
    'a': 'অ', 'A': 'আ', 'i': 'ই', 'I': 'ঈ', 'u': 'উ', 'U': 'ঊ', 'e': 'এ', 'o': 'ও', 'O': 'ও',
    'oi': 'ঐ', 'ou': 'ঔ', 'rri': 'ঋ'
}
DEPENDENT_VOWELS = {
    'a': 'া', 'i': 'ি', 'I': 'ী', 'u': 'ু', 'U': 'ূ', 'e': 'ে', 'o': 'ো', 'oi': 'ৈ', 'ou': 'ৌ', 'rri': 'ৃ'
}
CONSONANT_RULES = [
    ('kh', 'খ'), ('gh', 'ঘ'), ('ch', 'ছ'), ('jh', 'ঝ'), ('Th', 'ঠ'), ('Dh', 'ঢ'),
    ('th', 'থ'), ('dh', 'ধ'), ('ph', 'ফ'), ('bh', 'ভ'), ('sh', 'শ'), ('Sh', 'ষ'),
    ('Ng', 'ঙ'), ('ng', 'ং'), ('Y', 'ঞ'), ('Rh', 'ঢ়'), ('R', 'ড়'), ('t\`', 'ৎ'),
    ('k', 'ক'), ('g', 'গ'), ('c', 'চ'), ('j', 'জ'), ('T', 'ট'), ('D', 'ড'),
    ('t', 'ত'), ('d', 'দ'), ('n', 'ন'), ('p', 'প'), ('f', 'ফ'), ('b', 'ব'),
    ('v', 'ভ'), ('m', 'ম'), ('z', 'য'), ('r', 'র'), ('l', 'ল'), ('s', 'স'),
    ('h', 'হ'), ('N', 'ণ'), ('w', 'ও'), ('y', 'য়'), ('x', 'ক্স'), ('q', 'ক')
]

def transliterate(text):
    if not text: return ""
    result, i, n = "", 0, len(text)
    while i < n:
        vowel_match, vowel_len = None, 0
        for length in [3, 2, 1]:
            if i + length <= n:
                sub = text[i:i+length]
                if sub in INDEPENDENT_VOWELS:
                    vowel_match, vowel_len = sub, length
                    break
        if vowel_match:
            prev_char = text[i-1].lower() if i > 0 else ""
            has_consonant_prev = prev_char and (prev_char in CONSONANTS or (prev_char == 'h' and i > 1 and text[i-2].lower() in CONSONANTS))
            result += DEPENDENT_VOWELS.get(vowel_match, INDEPENDENT_VOWELS[vowel_match]) if has_consonant_prev else INDEPENDENT_VOWELS[vowel_match]
            i += vowel_len
            continue

        match_found = False
        for pattern, replacement in CONSONANT_RULES:
            length = len(pattern)
            if i + length <= n and text[i:i+length] == pattern:
                if len(result) > 0 and i > 0:
                    prev_input_char = text[i-1].lower()
                    if prev_input_char in CONSONANTS and pattern[0].lower() in CONSONANTS:
                        result += '্'
                result += replacement
                i += length
                match_found = True
                break
        if not match_found:
            result += text[i]
            i += 1
    return result

# --- X11 INTERCEPTION STATE ---
active_mode = "BANGLA"
input_buffer = []
lock = threading.Lock()
local_disp = display.Display()

def send_keypresses(english_word, bangla_word):
    # Sends backspaces to delete English characters and types Bangla Unicode via xdotool
    backspaces = len(english_word) + 1 # Plus 1 for space key itself
    # Backspace commands
    subprocess.run(["xdotool", "key", "--delay", "12", "BackSpace" * backspaces], stdout=subprocess.DEVNULL)
    # Type Bangla characters
    subprocess.run(["xdotool", "type", "--delay", "12", f"{bangla_word} "], stdout=subprocess.DEVNULL)

def lookup_keysym(keysym):
    # Simple conversion of X11 keysym to characters
    if 32 <= keysym <= 126:
        return chr(keysym)
    return None

def event_handler(reply):
    global active_mode, input_buffer
    if reply.category != record.FromServer: return
    if reply.client_swapped: return
    
    data = reply.data
    while len(data):
        event, data = rq.EventField(None).parse_binary_value(data, local_disp.display, None, None)
        if event.type == X.KeyPress:
            keysym = local_disp.keycode_to_keysym(event.detail, 0)
            
            # Switch Trigger (F12)
            if keysym == 0xffc9: # F12 KeySym
                with lock:
                    active_mode = "ENGLISH" if active_mode == "BANGLA" else "BANGLA"
                    input_buffer.clear()
                    print(f"[IME Status] Switched Mode to: {active_mode}")
                continue

            if active_mode == "ENGLISH":
                continue

            # Standard alphabet characters
            char = lookup_keysym(keysym)
            if char:
                if char.isalnum() or char == '\`':
                    with lock:
                        input_buffer.append(char)
                elif char == ' ':
                    with lock:
                        if input_buffer:
                            word = "".join(input_buffer)
                            bangla = transliterate(word)
                            # Run backspacing in background thread to not freeze X11 connection loop
                            threading.Thread(target=send_keypresses, args=(word, bangla)).start()
                            input_buffer.clear()
            
            # Backspace handler
            elif keysym == 0xff08: # BackSpace KeySym
                with lock:
                    if input_buffer:
                        input_buffer.pop()
            
            # Navigation clears buffer
            elif keysym in [0xff0d, 0xff09, 0xff1b, 0xff51, 0xff52, 0xff53, 0xff54]: # Enter, Tab, Escape, Left, Up, Right, Down
                with lock:
                    input_buffer.clear()

def start_x11_hook():
    ctx = local_disp.record_create_context(
        0,
        [record.AllClients],
        [{
            'core_requests': (0, 0),
            'core_replies': (0, 0),
            'ext_requests': (0, 0, 0, 0),
            'ext_replies': (0, 0, 0, 0),
            'delivered_events': (0, 0),
            'device_events': (X.KeyPress, X.KeyRelease),
            'errors': (0, 0),
            'client_started': False,
            'client_died': False,
        }]
    )
    print("====================================================")
    print("  Bangla Linux Keyboard Daemon Active (X11 Hooks)")
    print("  Press [F12] globally to toggle Bangla/English")
    print("  Ensuring zero-delay asynchronous event looping")
    print("====================================================")
    local_disp.record_enable_context(ctx, event_handler)
    local_disp.record_free_context(ctx)

if __name__ == "__main__":
    try:
        start_x11_hook()
    except KeyboardInterrupt:
        sys.exit(0)
`;

export const DEBIAN_CONTROL_FILE = `Package: banglapro-ime
Version: 1.0.0
Section: utils
Priority: optional
Architecture: all
Maintainer: BanglaPro Team <support@banglapro.io>
Depends: python3 (>= 3.8), python3-pynput, python3-xlib, xdotool, systemd
Description: High performance Linux OS-level phonetic Bangla Input Method Editor.
 Intercepts system keyboard triggers at the X11 session layer, 
 transliterates English sequences into Bangla Unicode characters in real-time, 
 and simulates backspaces instantly.
`;

export const DEBIAN_POSTINST_FILE = `#!/bin/sh
# postinst script for banglapro-ime
# Automatically registers daemon as an active system startup service

set -e

case "$1" in
    configure)
        echo "Registering banglapro-ime startup service..."
        
        # Reload systemd system-wide configs
        systemctl daemon-reload || true
        
        # Enable and launch the user-session daemon
        systemctl enable banglapro-ime.service || true
        echo "BanglaPro IME installation completed successfully!"
    ;;

    abort-upgrade|abort-remove|abort-deconfigure)
    ;;

    *)
        echo "postinst called with unknown argument: \$1" >&2
        exit 1
    ;;
esac

exit 0
`;

export const SYSTEMD_SERVICE_FILE = `[Unit]
Description=Bangla Phonetic Keyboard Hook Service Daemon
After=display-manager.service xorg.target
Requires=display-manager.service

[Service]
Type=simple
Environment=DISPLAY=:0
ExecStart=/usr/bin/python3 /usr/share/banglapro-ime/linux_x11_hook.py
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=graphical.target
`;

