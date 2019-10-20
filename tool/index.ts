import fetch from 'node-fetch';

export type TestEntry = { emoji: string; details: string };

const testLinePattern = /^([^;#]*);([^#]*)#(.*)$/;

export function parseTestLine(line: string): 'match-fail' | 'skip' | TestEntry {
    const match = testLinePattern.exec(line);
    if(match !== null) {
        if(match[2].trim() !== 'fully-qualified')
            return 'skip';

        const cps = match[1].split(' ')
            .filter(s => s.length > 0)
            .map(s => Number.parseInt(s, 16));
        const emojiString = String.fromCodePoint(...cps);
        const trimmedDetails = match[3].trim();
        const details = trimmedDetails.startsWith(emojiString)
            ? trimmedDetails.substr(emojiString.length).trimStart()
            : trimmedDetails;
        return {
            emoji: emojiString,
            details
        };
    } else {
        return 'match-fail';   
    }
}

export function *parseTestFile(
    source: string,
    onSkippedLine?: (line: string) => void
): IterableIterator<TestEntry> {
    const lines = source.split('\n');
    for(const line of lines) {
        const parsed = parseTestLine(line);
        if(parsed === 'match-fail') {
            if(onSkippedLine !== undefined)
                onSkippedLine(line);
        } else if(parsed !== 'skip')
            yield parsed;
    }
}

async function main() {
    const fileContents = await fetch('https://unicode.org/Public/emoji/12.0/emoji-test.txt')
        .then(r => r.text());
    const entries = parseTestFile(fileContents);

    for(const entry of entries) {
        process.stdout.write(`"${entry.emoji}"\t"${entry.details}"\t""\n`);
    }    
}

main();
