// Your Google API Key
const API_KEY = 'AIzaSyDDdX4TXJ0y74QbaWQAgymfhxAw2iWP_OU';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const changesText = document.getElementById('changesText');
const correctBtn = document.getElementById('correctBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const outputSection = document.getElementById('outputSection');
const changesSection = document.getElementById('changesSection');
const errorMessage = document.getElementById('errorMessage');
const charCount = document.getElementById('charCount');

// Event Listeners
inputText.addEventListener('input', updateCharCount);
correctBtn.addEventListener('click', correctGrammar);
clearBtn.addEventListener('click', clearAll);
copyBtn.addEventListener('click', copyToClipboard);

// Enter key support (Ctrl/Cmd + Enter to correct)
inputText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        correctGrammar();
    }
});

// Update character count
function updateCharCount() {
    const count = inputText.value.length;
    charCount.textContent = count;
    
    if (count > 0) {
        correctBtn.disabled = false;
    } else {
        correctBtn.disabled = true;
    }
}

// Clear all inputs and outputs
function clearAll() {
    inputText.value = '';
    outputText.textContent = '';
    changesText.textContent = '';
    outputSection.style.display = 'none';
    errorMessage.style.display = 'none';
    changesSection.style.display = 'none';
    updateCharCount();
    inputText.focus();
}

// Copy corrected text to clipboard
async function copyToClipboard() {
    const text = outputText.textContent;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="btn-icon">✓</span>Copied!';
        copyBtn.style.background = '#45a049';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '#4CAF50';
        }, 2000);
    } catch (err) {
        showError('Failed to copy to clipboard. Please try again.');
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Main grammar correction function
async function correctGrammar() {
    const text = inputText.value.trim();
    
    if (!text) {
        showError('Please enter a Kannada sentence to correct.');
        return;
    }
    
    // Show loading state
    loadingSpinner.style.display = 'block';
    outputSection.style.display = 'none';
    errorMessage.style.display = 'none';
    correctBtn.disabled = true;
    
    try {
        const prompt = `You are an expert Kannada grammar corrector. Your task is to:
1. Correct any grammatical errors in the following Kannada sentence.
2. Fix spelling mistakes if any.
3. Improve sentence structure while maintaining the original meaning.
4. Provide the corrected sentence.
5. Briefly explain what changes were made (in English or Kannada).

Original Kannada sentence: "${text}"

Please respond in the following format:
CORRECTED: [corrected sentence here]
CHANGES: [list of changes made]

If the sentence is already grammatically correct, just say "CORRECTED: [same sentence]" and "CHANGES: No changes needed. The sentence is grammatically correct."`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to connect to the API');
        }
        
        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No response from the AI model');
        }
        
        const resultText = data.candidates[0].content.parts[0].text;
        
        // Parse the response
        parseAndDisplayResult(resultText);
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Error: ${error.message}. Please check your internet connection and API key.`);
    } finally {
        loadingSpinner.style.display = 'none';
        correctBtn.disabled = false;
    }
}

// Parse and display the result
function parseAndDisplayResult(resultText) {
    // Extract corrected text
    const correctedMatch = resultText.match(/CORRECTED:\s*(.+?)(?=\nCHANGES:|$)/s);
    const changesMatch = resultText.match(/CHANGES:\s*(.+)/s);
    
    let correctedSentence = '';
    let changes = '';
    
    if (correctedMatch) {
        correctedSentence = correctedMatch[1].trim();
    } else {
        // If format doesn't match, use the whole response as corrected text
        correctedSentence = resultText.trim();
    }
    
    if (changesMatch) {
        changes = changesMatch[1].trim();
    }
    
    // Display the results
    outputText.textContent = correctedSentence;
    outputSection.style.display = 'block';
    
    if (changes && changes.toLowerCase() !== 'none' && !changes.toLowerCase().includes('no changes needed')) {
        changesText.textContent = changes;
        changesSection.style.display = 'block';
    } else {
        changesSection.style.display = 'none';
    }
    
    // Scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize
updateCharCount();
inputText.focus();
