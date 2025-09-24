import React from 'react';

// Custom component to render the bot message with improved formatting and bullet points
export const renderBotMessage = (text) => {
    const lines = text.split('\n');
    let elements = [];
    let listItems = [];
    let inList = false;

    const processBoldText = (line) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={partIndex} className="font-bold text-gray-100">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        if (trimmedLine === '---') {
            if (inList) {
                elements.push(
                    <ul
                        key={`list-${index - listItems.length}`}
                        className="list-disc list-inside space-y-1 my-2 pl-4 text-gray-200"
                    >
                        {listItems}
                    </ul>
                );
                listItems = [];
                inList = false;
            }
            elements.push(<hr key={`hr-${index}`} className="my-6 border-purple-700/50" />);
            return;
        }

        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            const content = trimmedLine.substring(2);
            listItems.push(
                <li key={`li-${index}`} className="flex items-start">
                    <div>{processBoldText(content)}</div>
                </li>
            );
            inList = true;
        } else {
            if (inList) {
                elements.push(
                    <ul
                        key={`list-${index - listItems.length}`}
                        className="list-disc list-inside space-y-1 my-2 pl-4 text-gray-200"
                    >
                        {listItems}
                    </ul>
                );
                listItems = [];
                inList = false;
            }

            if (trimmedLine.match(/^[A-Z][a-zA-Z\s]+:/) && !trimmedLine.includes('**')) {
                if (
                    lines[index + 1] &&
                    !(lines[index + 1].trim().startsWith('* ') || lines[index + 1].trim().startsWith('- '))
                ) {
                    elements.push(
                        <h4
                            key={`h4-${index}`}
                            className="font-bold text-lg text-purple-300 mt-4 mb-2"
                        >
                            {trimmedLine}
                        </h4>
                    );
                } else {
                    elements.push(
                        <p
                            key={`para-${index}`}
                            className="font-semibold text-lg text-purple-300 mt-4 mb-2"
                        >
                            {trimmedLine}
                        </p>
                    );
                }
            } else if (trimmedLine !== '') {
                elements.push(
                    <p
                        key={`p-${index}`}
                        className="text-base leading-relaxed text-gray-200 mb-2"
                    >
                        {processBoldText(trimmedLine)}
                    </p>
                );
            }
        }
    });

    if (inList) {
        elements.push(
            <ul
                key={`list-final`}
                className="list-disc list-inside space-y-1 my-2 pl-4 text-gray-200"
            >
                {listItems}
            </ul>
        );
    }

    return elements;
};
