import { getImageFromDallE } from './dallE.js';

const endpointURL = 'http://localhost:3001/chat';

let outputElement, submitButton, inputElement, historyElement, newChatButton, sideBarElement, chatCount = 0;
let currentChatId = 0;
const recognition = new window.webkitSpeechRecognition(); // Create speech recognition instance

window.onload = init;

function init() {
    outputElement = document.querySelector('#output');
    submitButton = document.querySelector('#submit');
    submitButton.onclick = getMessage;

    inputElement = document.querySelector('#user-input');
    inputElement.addEventListener('input', handleInput);

    historyElement = document.querySelector('#history');
    newChatButton = document.querySelector('#new-chat');
    newChatButton.onclick = createNewChat;
    sideBarElement = document.querySelector('#side-bar');

    createInitialButtons();

    loadChatHistory();
    const voiceButton = document.getElementById('voice-button');
    voiceButton.onclick = startRecording;

    const firstChatElement = document.querySelector('.history-item');
    if (firstChatElement) {
        const chatId = firstChatElement.dataset.chatId;
        switchChat(chatId);
    } else {
        createNewChat();
    }
}
function startRecording() {
    recognition.start();
    // en français
    recognition.lang = 'fr-FR';
    console.log('Recording started');
}
function handleInput(event) {
    const userInput = event.target.value;
    const suggestionContainer = document.getElementById('suggestion-container');

    if (userInput.includes('/')) {
        const suggestions = [
            { command: 'image', description: 'Image' },
            { command: 'assistant', description: 'Assistant MIAGE NICE' },
            { command: 'speech', description: 'Speech' }
        ];

        suggestionContainer.innerHTML = '';
        suggestionContainer.style.display = 'block';
        suggestionContainer.style.color = 'white';
        
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = `${suggestion.command} - ${suggestion.description}`;
            suggestionItem.dataset.command = suggestion.command;

            suggestionItem.onclick = () => {
                inputElement.value = suggestion.command + ' ';
                suggestionContainer.style.display = 'none';
                inputElement.focus();
            };

            suggestionContainer.appendChild(suggestionItem);
        });
    } else {
        suggestionContainer.style.display = 'none';
    }
}




recognition.onresult = async function(event) {
    const voiceText = event.results[0][0].transcript;
    console.log('Voice to text:', voiceText);
    inputElement.value = voiceText.trim();
    await getMessage(); // Trigger message handling as if user entered text
};
function stopRecording() {
    recognition.stop();
    console.log('Recording stopped');
}
function loadChatHistory() {
    const savedChatCount = localStorage.getItem('chatCount');
    if (savedChatCount) {
        chatCount = parseInt(savedChatCount, 10);
        for (let i = 1; i <= chatCount; i++) {
            createChatElement(i);
        }
    }
}

function clearInput() {
    inputElement.value = '';
}

function createChatElement(chatId) {
    const chatElement = document.createElement('div');
    chatElement.classList.add('history-item');
    chatElement.textContent = `Conver ${chatId}`;
    chatElement.style.cursor = 'pointer';
    chatElement.style.color = 'white';
    chatElement.dataset.chatId = chatId;
    chatElement.onclick = () => switchChat(chatId);

    // Button to access this conversation
    const accessButton = document.createElement('button');
    accessButton.textContent = `Access`;
    accessButton.onclick = (event) => {
        event.stopPropagation();
        switchChat(chatId);
        updateButtonStyles(accessButton); // Update button styles on click
    };
    chatElement.appendChild(accessButton);

    // Button to delete this conversation
    const deleteButton = document.createElement('button');
    deleteButton.textContent = `Delete`;
    deleteButton.onclick = (event) => {
        event.stopPropagation();
        deleteChat(chatId);
    };
    chatElement.appendChild(deleteButton);
    sideBarElement.insertBefore(chatElement, newChatButton.nextSibling);
}

function updateButtonStyles(clickedButton) {
    // Remove the class from all buttons
    const allButtons = document.querySelectorAll('.history-item button');
    allButtons.forEach(button => button.classList.remove('button-clicked'));

    // Add the class to the clicked button
    clickedButton.classList.add('button-clicked');
}

function deleteChat(chatId) {
    const savedMessagesKey = `chat_${chatId}_messages`;
    localStorage.removeItem(savedMessagesKey);

    const chatElements = document.querySelectorAll('.history-item');
    chatElements.forEach(el => {
        if (el.dataset.chatId == chatId) {
            el.remove();
        }
    });

    // Trouver l'index de la conversation à supprimer dans chatCount
    const chatIdIndex = chatCount - chatId;

    if (chatId === currentChatId) {
        outputElement.innerHTML = '';
        currentChatId = 0;
        const initialButtonsContainer = document.querySelector('.initial-buttons');
        initialButtonsContainer.style.display = 'flex';
    }

    // Mettre à jour chatCount
    if (chatIdIndex >= 0) {
        chatCount--;
        localStorage.setItem('chatCount', chatCount);
    }
}
function createNewChat() {
    const chatId = ++chatCount;
    localStorage.setItem('chatCount', chatCount);
    createChatElement(chatId);
    switchChat(chatId);
    const initialButtonsContainer = document.querySelector('.initial-buttons');
    initialButtonsContainer.style.display = 'flex';
}
function createInitialButtons() {
    const initialButtonsContainer = document.querySelector('.initial-buttons');

    const buttons = [
        { icon: '<i class="fa-solid fa-photo-film" style="color: #B197FC;"></i>', text: 'Design a fun coding game', command: 'image Design a fun coding game' },
        { icon: '<i class="fa-solid fa-volume-off" style="color: #FFD43B;"></i>', text: 'Dit moi Bonjour', command: 'speech Bonjour' },
        { icon: '<i class="fa-solid fa-handshake-angle" style="color: #74C0FC;"></i>', text: 'Donne moi des info sur la Miage', command: 'assistant Donne moi des info sur la Miage' },
        { icon: '<i class="fa-solid fa-photo-film" style="color: #B197FC;"></i>', text: 'Cat an dog', command: 'image Cat an dog' }
    ];

    buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        const iconElement = document.createElement('span');
        iconElement.innerHTML = button.icon;
        buttonElement.appendChild(iconElement);
        buttonElement.appendChild(document.createTextNode(button.text));

        buttonElement.addEventListener('click', async () => {
            inputElement.value = button.command;
            await getMessage(); // Assurez-vous d'attendre la résolution de getMessage()
            initialButtonsContainer.style.display = 'none';
        });

        initialButtonsContainer.appendChild(buttonElement);
    });
}

function switchChat(chatId) {
    currentChatId = chatId;
    const savedMessages = getSavedMessages(chatId);

    outputElement.innerHTML = ''; // Clear current output

    const showInitialButtons = savedMessages.length === 0;

    savedMessages.forEach(message => {
        if (message.sender === 'user') {
            displayUserMessage(message.content);
        } else if (message.sender === 'assistant') {
            displayAssistantResponse(message.content);
        }
    });

    const initialButtonsContainer = document.querySelector('.initial-buttons');
    initialButtonsContainer.style.display = showInitialButtons ? 'flex' : 'none';
}

function getSavedMessages(chatId) {

    const savedMessagesKey = `chat_${chatId}_messages`;
    let savedMessages = localStorage.getItem(savedMessagesKey);

    if (savedMessages) {
        savedMessages = JSON.parse(savedMessages);
        return savedMessages;
    } else {
        return [];
    }
}

function saveMessage(chatId, sender, content, messageType = 'text') {
    const savedMessagesKey = `chat_${chatId}_messages`;
    let savedMessages = localStorage.getItem(savedMessagesKey);

    if (savedMessages) {
        savedMessages = JSON.parse(savedMessages);
    } else {
        savedMessages = [];
    }

    if (messageType === 'text') {
        savedMessages.push({ sender, content });
    } else if (messageType === 'image') {
        // Ajouter à la fois l'URL de l'image et la question d'origine
        savedMessages.push({ sender, type: 'image', url: content.url, question: content.question });
    }

    localStorage.setItem(savedMessagesKey, JSON.stringify(savedMessages));
}

const miageInfo = `
    La MIAGE Nice Sophia Antipolis est une filière d'excellence professionnalisante au sein de l'Université Côte d'Azur.
    Elle propose des formations de haut niveau en Licence, Master et Doctorat dans les domaines du développement informatique, du management et de l'ingénierie des systèmes d'information.
    \n
    Atouts de la MIAGE Nice Sophia Antipolis :
    - Excellence académique
    - Formation pluridisciplinaire
    - Lien étroit avec le monde professionnel
    - Environnement dynamique sur le technopole de Sophia Antipolis.
    \n
    Détail des Formations :
    - Licence MIAGE : (Description détaillée)
    - Master MIAGE : (Description détaillée)
    - Doctorat MIAGE : (Description détaillée)
    \n
    Formations à la MIAGE Nice Sophia Antipolis :
     La MIAGE Nice Sophia Antipolis propose des formations de haut niveau en Licence, Master et Doctorat dans les domaines du développement informatique, du management et de l'ingénierie des systèmes d'information.

    **Licence MIAGE**
     - **Objectifs :** Acquérir des bases solides en informatique, permettant de poursuivre des études en Master ou d'intégrer le monde professionnel.
     - **Contenu :** Programmation, algorithmique, architecture informatique, bases de données, réseaux, systèmes d'exploitation, web, etc.
     - **Durée :** 3 ans (6 semestres)

    **Master MIAGE**
     - **Objectifs :** Développer une expertise pointue dans un domaine spécifique de l'informatique et du numérique.
     - **Parcours :**
      - Développement web et mobile
      - Intelligence artificielle
      - Cybersécurité
      - Big data
      - Gestion de projet informatique
      - Data Science
      - Sécurité des systèmes d'information
      - Logiciels embarqués
      - Réseaux et télécommunications
      - **Durée :** 2 ans (4 semestres)

    **Doctorat MIAGE**
     - **Objectifs :** Mener des recherches de pointe en informatique et contribuer à l'avancement des connaissances dans ce domaine.
     - **Spécialisations :**
     - Intelligence artificielle
     - Cybersécurité
     - Big data
     - Logiciels embarqués
     - Réseaux et télécommunications
     - **Durée :** 3 ans
    \n
    **Modalités d'admission :**
L'admission à la MIAGE Nice Sophia Antipolis est sélective et se fait sur dossier et après réussite d'un concours.

**Licence MIAGE**
- **Dossier :** Baccalauréat avec une mention au moins assez bien, notamment en mathématiques et en sciences informatiques.
- **Concours :** Concours BCE ou écrit spécifique à la MIAGE.

**Master MIAGE**
- **Dossier :** Licence en informatique ou domaine connexe avec un bon dossier académique.
- **Concours :** Écrit et oral.

**Doctorat MIAGE**
- **Dossier :** Master en informatique ou domaine connexe avec une excellente mention de recherche.
- **Concours :** Écrit et oral.
    \n
    **Vie étudiante :**
La vie étudiante à la MIAGE Nice Sophia Antipolis est riche et dynamique. L'université propose un large éventail d'activités et d'associations permettant aux étudiants de s'épanouir et de se divertir.
- **Associations :** Plus de 200 associations étudiantes sont présentes sur le campus, couvrant tous les domaines d'intérêt : sport, culture, solidarité, entrepreneuriat, etc.
- **Événements :** Des événements sont organisés régulièrement tout au long de l'année, tels que des conférences, des concerts, des festivals et des soirées étudiantes.
- **Services aux étudiants :** L'université propose de nombreux services aux étudiants, tels qu'un service de restauration, un service de logement, un service de santé et un service d'orientation.
    \n
     **Débouchés professionnels :**
Les diplômés de la MIAGE Nice Sophia Antipolis sont très recherchés par les entreprises. Ils occupent des postes à responsabilité dans les secteurs de l'informatique, du conseil, de l'industrie et des services.
- **Exemples de métiers :**
    - Développeur informatique
    - Ingénieur logiciel
    - Data scientist
    - Chef de projet informatique
    - Consultant en informatique
    - Architecte informatique
    - Responsable de la sécurité des systèmes d'information
    - Entrepreneur
- **Salaires :** Les salaires des diplômés de la MIAGE Nice Sophia Antipolis sont attractifs et évoluent rapidement en fonction de l'expérience et du domaine de spécialisation.
    \n
`;

function generatePrompt(userInput) {
    return `${miageInfo}\n\nQuestion: ${userInput}\nRéponse:`;
}

async function getMessage() {
    const initialButtonsContainer = document.querySelector('.initial-buttons');
    if (initialButtonsContainer.style.display !== 'none') {
        initialButtonsContainer.style.display = 'none';
    }

    let userInput = inputElement.value.trim().toLowerCase(); // Conversion en minuscules

    let displayInput = userInput; // Garder la version affichée de l'entrée utilisateur

    if (userInput.startsWith('image')) {
        displayInput = userInput.slice(5).trim();
        displayUserMessage(displayInput);

        userInput = displayInput; // Mettre à jour pour traitement
        try {
            let images = await getImageFromDallE(userInput);
            console.log(images);

            images.data.forEach(imageObj => {
                const imageContainer = document.createElement('div');
                imageContainer.classList.add('message', 'user-message', 'image-container');

                const imgElement = document.createElement('img');
                imgElement.src = imageObj.url;
                imgElement.width = 256;
                imgElement.height = 256;

                imageContainer.appendChild(imgElement);
                outputElement.appendChild(imageContainer);

                // Sauvegarde de l'image
                saveMessage(currentChatId, 'user', { type: 'image', url: imageObj.url, question: userInput });
            });
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    }  else if (userInput.startsWith('speech')) {
        displayInput = userInput.slice(6).trim();
        displayUserMessage(displayInput);
    
        userInput = displayInput; // Mettre à jour pour traitement
        try {
            const response = await getResponseFromServer(userInput);
            console.log('Response from server:', response);
    
            if (response && response.choices && response.choices.length > 0) {
                speakText(response.choices[0].message.content);
                displayAssistantResponse(response.choices[0].message.content);
                saveMessage(currentChatId, 'user', userInput);
                saveMessage(currentChatId, 'assistant', response.choices[0].message.content);
    
                const pElement = document.createElement('p');
                pElement.textContent = userInput;
                pElement.onclick = () => {
                    inputElement.value = pElement.textContent;
                };
                historyElement.append(pElement);
            } else {
                console.error('Invalid response format:', response);
            }
        } catch (error) {
            console.error('Error fetching chat response:', error);
        }
    }  else if (userInput.startsWith('assistant')) {
        displayInput = userInput.slice(9).trim();
        displayUserMessage(displayInput);

        const prompt = generatePrompt(displayInput);
        try {
            const response = await getResponseFromServer(prompt);
            displayAssistantResponse(response.choices[0].message.content);
            saveMessage(currentChatId, 'user', userInput);
            saveMessage(currentChatId, 'assistant', response.choices[0].message.content);
        } catch (error) {
            console.error('Error fetching chat response:', error);
        }
    } else {
        displayUserMessage(displayInput);
        saveMessage(currentChatId, 'user', userInput);

        try {
            const response = await getResponseFromServer(userInput);
            displayAssistantResponse(response.choices[0].message.content);
            saveMessage(currentChatId, 'assistant', response.choices[0].message.content);
        } catch (error) {
            console.error('Error fetching chat response:', error);
        }
    }

    clearInput();
}

function displayUserMessage(message) {
    if (typeof message === 'string') {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        outputElement.appendChild(messageElement);
    } else if (typeof message === 'object' && message.type === 'image' && message.url) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';

        // Affichage de la question d'origine
        const questionElement = document.createElement('p');
        questionElement.textContent = `Question: ${message.question}`;
        messageElement.appendChild(questionElement);

        // Affichage de l'image
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const imgElement = document.createElement('img');
        imgElement.src = message.url;
        imgElement.width = 256;
        imgElement.height = 256;

        imageContainer.appendChild(imgElement);
        messageElement.appendChild(imageContainer);

        outputElement.appendChild(messageElement);
    }
}


function displayAssistantResponse(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';
    messageElement.innerHTML = message;
    outputElement.appendChild(messageElement);
}

async function getResponseFromServer(prompt) {
    try {
        const promptData = new FormData();
        promptData.append('prompt', prompt);

        const response = await fetch(endpointURL, {
            method: 'POST',
            body: promptData
        });

        const data = await response.json();
        console.log('Response from server:', data);

        if (data && data.choices && data.choices.length > 0) {
            return data;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error fetching chat response:', error);
        throw error;
    }
}

// Fonction pour la synthèse vocale
function speakText(text) {
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    } else {
        console.error('Speech synthesis not supported');
    }
}
