export class Translatable {
    constructor() {
        this.translationMap = new Map();
    }

    async loadJson(jsonData) {
        try {
            const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            this.translationMap.clear();
            for (const [key, value] of Object.entries(parsedData)) {
                this.translationMap.set(key, value);
            }
        } catch (error) {
            console.error("Failed to load JSON data:", error);
        }
    }

    translate(key) {
        return this.translationMap.get(key) || key;
    }

    async swapJson(jsonFileUrl) {
        try {
            const response = await fetch(jsonFileUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch JSON file: ${response.statusText}`);
            }
            const jsonData = await response.json();
            await this.loadJson(jsonData);
        } catch (error) {
            console.error("Failed to swap JSON file:", error);
        }
    }
}