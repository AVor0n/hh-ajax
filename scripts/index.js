import { api } from './api.js';
import { createElement, debounce } from './utils.js';

const search = document.querySelector('.search__input');
const suggestions = document.querySelector('.search__suggestions');
const details = document.querySelector('.details');
const recentRequests = document.querySelector('.requests-history__list');

const getRequestHistoryFromLS = () => {
    try {
        const requests = localStorage.getItem('requests');
        return requests ? JSON.parse(requests) : [];
    } catch {
        return [];
    }
};

const clearSearchResult = () => {
    details.innerHTML = '';
};

const showResultsFor = async key => {
    details.textContent = '...Загрузка...';

    try {
        const { title, description, cover, authors } = await api.getBookInfo(key);
        clearSearchResult();

        details.appendChild(
            createElement('article', {}, [
                createElement('h1', { textContent: title }),
                createElement('img', { src: cover, width: 200, height: 300 }),
                createElement('div', {}, [
                    createElement('dt', { textContent: 'Название' }),
                    createElement('dd', { textContent: title }),
                    createElement('dt', { textContent: 'Описание' }),
                    createElement('dd', { textContent: description ?? 'Не найдено' }),
                    createElement('dt', {
                        textContent: authors.length > 1 ? 'Авторы' : 'Автор',
                    }),
                    createElement('dd', { textContent: authors.join(', ') }),
                ]),
            ]),
        );
    } catch (error) {
        details.textContent = `Ошибка при обращении к API: ${error}`;
    }
};

const clearSuggestions = () => {
    suggestions.innerHTML = '';
};

const addSuggestion = (suggestion, options = {}) => {
    const li = Object.assign(document.createElement('li'), {
        className: `search__suggestion${options.fromHistory ? ' search__suggestion--history' : ''}`,
        textContent: suggestion.title,
    });
    li.dataset.key = suggestion.key;
    suggestions.appendChild(li);
};

const updateRequestHistory = () => {
    recentRequests.innerHTML = '';

    const requests = getRequestHistoryFromLS()
        .reverse()
        .slice(0, 3)
        .map(({ title }) => title);

    requests.forEach(request => {
        recentRequests?.appendChild(
            createElement('li', {
                textContent: request,
            }),
        );
    });
};

const onInput = async () => {
    const query = search.value.toLowerCase();
    clearSuggestions();

    if (query === '') {
        return;
    }

    const suggestionsFromAPI = await api.getSuggestions(query);
    const suggestionsFromLS = getRequestHistoryFromLS()
        .filter(suggest => suggest.title.toLowerCase().includes(query))
        .slice(0, 5);

    suggestionsFromLS.forEach(suggestion => addSuggestion(suggestion, { fromHistory: true }));
    suggestionsFromAPI
        .filter(suggestion => !suggestionsFromLS.find(suggest => suggest.key === suggestion.key))
        .slice(0, 10 - suggestionsFromLS.length)
        .forEach(suggestion => addSuggestion(suggestion));
};

const onSearch = suggest => {
    clearSuggestions();
    clearSearchResult();
    search.value = suggest.title;

    try {
        const newRequestsList = getRequestHistoryFromLS();
        if (!newRequestsList.find(request => request.key === suggest.key)) {
            newRequestsList.push(suggest);
        }
        localStorage.setItem('requests', JSON.stringify(newRequestsList));
    } catch {
        const confirmClearLS = confirm('LS переполнен. Очистить всё?');
        if (confirmClearLS) {
            localStorage.clear();
            localStorage.setItem('requests', JSON.stringify([suggest]));
        }
    }
    updateRequestHistory();
    showResultsFor(suggest.key);
};

const onInitPage = () => {
    updateRequestHistory();

    search.addEventListener('input', debounce(onInput, 500));

    suggestions.addEventListener('click', event => {
        onSearch({
            title: event.target.textContent,
            key: event.target.dataset.key,
        });
    });

    window.addEventListener('storage', event => {
        if (event.key === 'requests') {
            updateRequestHistory();
        }
    });
};

onInitPage();
