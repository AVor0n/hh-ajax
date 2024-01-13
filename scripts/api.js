const getSuggestions = async query => {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
        `https://openlibrary.org/search.json?q=title_suggest:${encodedQuery}&fields=title,key&limit=10`,
    ).then(res => res.json());
    return response.docs.map(suggest => ({ ...suggest, key: suggest.key.split('/').at(-1) }));
};

const getBookInfo = async id => {
    const bookInfo = await fetch(`https://openlibrary.org/works/${id}.json`).then(res =>
        res.json(),
    );

    const authors = await Promise.all(
        bookInfo.authors.map(({ author }) =>
            fetch(`https://openlibrary.org${author.key}.json`)
                .then(res => res.json())
                .then(res => res.name),
        ),
    );

    return {
        title: bookInfo.title,
        description: bookInfo.description?.value ?? bookInfo.description ?? null,
        cover: bookInfo.covers?.[0]
            ? `https://covers.openlibrary.org/b/id/${bookInfo.covers?.[0]}-M.jpg`
            : 'https://bricks-stones.ru/image/cache/no_image-650x850.png',
        authors,
    };
};

export const api = {
    getBookInfo,
    getSuggestions,
};
