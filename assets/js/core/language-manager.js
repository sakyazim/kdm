/**
 * Language Manager
 * Handles multi-language support for the library application
 * Supports Turkish (tr) and English (en)
 */

export class LanguageManager {
    /**
     * Available languages in the application
     */
    static LANGUAGES = {
        TR: 'tr',
        EN: 'en'
    };

    /**
     * Default language
     */
    static DEFAULT_LANGUAGE = 'tr';

    /**
     * LocalStorage key for language preference
     */
    static STORAGE_KEY = 'library_language';

    /**
     * Get current language from localStorage or default
     * @returns {string} Current language code ('tr' or 'en')
     */
    static getCurrentLanguage() {
        try {
            const savedLanguage = localStorage.getItem(this.STORAGE_KEY);

            // Validate saved language
            if (savedLanguage && Object.values(this.LANGUAGES).includes(savedLanguage)) {
                return savedLanguage;
            }

            // Return default if no valid language found
            return this.DEFAULT_LANGUAGE;
        } catch (error) {
            console.error('Error reading language from localStorage:', error);
            return this.DEFAULT_LANGUAGE;
        }
    }

    /**
     * Set language and persist to localStorage
     * @param {string} languageCode - Language code to set ('tr' or 'en')
     * @param {boolean} reload - Whether to reload page after setting (default: true)
     */
    static setLanguage(languageCode, reload = true) {
        try {
            // Validate language code
            if (!Object.values(this.LANGUAGES).includes(languageCode)) {
                console.error(`Invalid language code: ${languageCode}`);
                return false;
            }

            // Save to localStorage
            localStorage.setItem(this.STORAGE_KEY, languageCode);

            // Dispatch custom event for language change
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: languageCode }
            }));

            // Reload page to apply language change
            if (reload) {
                window.location.reload();
            }

            return true;
        } catch (error) {
            console.error('Error setting language:', error);
            return false;
        }
    }

    /**
     * Toggle between available languages
     */
    static toggleLanguage() {
        const currentLang = this.getCurrentLanguage();
        const newLang = currentLang === this.LANGUAGES.TR ? this.LANGUAGES.EN : this.LANGUAGES.TR;
        this.setLanguage(newLang);
    }

    /**
     * Get language-specific data file path
     * @param {string} basePath - Base path without extension (e.g., 'data/global/header')
     * @param {string} language - Language code (optional, uses current if not provided)
     * @returns {string} Full path with language suffix (e.g., 'data/global/header.tr.json')
     */
    static getDataPath(basePath, language = null) {
        const lang = language || this.getCurrentLanguage();

        // Remove .json extension if present
        const cleanPath = basePath.replace(/\.json$/, '');

        // Return path with language suffix
        return `${cleanPath}.${lang}.json`;
    }

    /**
     * Load JSON data file for current language
     * @param {string} basePath - Base path without language suffix
     * @param {string} language - Language code (optional)
     * @returns {Promise<Object>} Parsed JSON data
     */
    static async loadLanguageData(basePath, language = null) {
        try {
            const dataPath = this.getDataPath(basePath, language);
            const response = await fetch(dataPath);

            if (!response.ok) {
                throw new Error(`Failed to load ${dataPath}: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error loading language data from ${basePath}:`, error);

            // Try fallback to default language if not already using it
            const currentLang = language || this.getCurrentLanguage();
            if (currentLang !== this.DEFAULT_LANGUAGE) {
                console.warn(`Falling back to ${this.DEFAULT_LANGUAGE} language`);
                return this.loadLanguageData(basePath, this.DEFAULT_LANGUAGE);
            }

            throw error;
        }
    }

    /**
     * Get language name for display
     * @param {string} languageCode - Language code
     * @returns {string} Display name
     */
    static getLanguageName(languageCode) {
        const names = {
            [this.LANGUAGES.TR]: 'Türkçe',
            [this.LANGUAGES.EN]: 'English'
        };
        return names[languageCode] || languageCode.toUpperCase();
    }

    /**
     * Get language flag emoji
     * @param {string} languageCode - Language code
     * @returns {string} Flag emoji
     */
    static getLanguageFlag(languageCode) {
        const flags = {
            [this.LANGUAGES.TR]: '🇹🇷',
            [this.LANGUAGES.EN]: '🇬🇧'
        };
        return flags[languageCode] || '🌐';
    }

    /**
     * Get all available languages with metadata
     * @returns {Array<Object>} Array of language objects
     */
    static getAvailableLanguages() {
        return Object.values(this.LANGUAGES).map(code => ({
            code,
            name: this.getLanguageName(code),
            flag: this.getLanguageFlag(code),
            isCurrent: code === this.getCurrentLanguage()
        }));
    }

    /**
     * Update document language attribute
     */
    static updateDocumentLanguage() {
        const lang = this.getCurrentLanguage();
        document.documentElement.setAttribute('lang', lang);
    }

    /**
     * Common UI translations (for dynamic JavaScript components)
     * @returns {Object} Translations object
     */
    static getTranslations() {
        const lang = this.getCurrentLanguage();

        const translations = {
            tr: {
                open: 'Açık',
                closed: 'Kapalı',
                loading: 'Yükleniyor...',
                error: 'Hata',
                noData: 'Veri bulunamadı',
                search: 'Ara',
                filter: 'Filtrele',
                showMore: 'Daha Fazla Göster',
                showLess: 'Daha Az Göster',
                readMore: 'Devamını Oku',
                close: 'Kapat'
            },
            en: {
                open: 'Open',
                closed: 'Closed',
                loading: 'Loading...',
                error: 'Error',
                noData: 'No data found',
                search: 'Search',
                filter: 'Filter',
                showMore: 'Show More',
                showLess: 'Show Less',
                readMore: 'Read More',
                close: 'Close'
            }
        };

        return translations[lang] || translations.tr;
    }

    /**
     * Get a specific translation by key
     * @param {string} key - Translation key
     * @returns {string} Translated text
     */
    static t(key) {
        const translations = this.getTranslations();
        return translations[key] || key;
    }

    /**
     * Initialize language manager
     * Call this on app startup
     */
    static init() {
        this.updateDocumentLanguage();

        // Listen for language change events
        window.addEventListener('languageChanged', (event) => {
            this.updateDocumentLanguage();
            console.log(`Language changed to: ${event.detail.language}`);
        });

        console.log(`LanguageManager initialized. Current language: ${this.getCurrentLanguage()}`);
    }
}

// Auto-initialize when module loads
LanguageManager.init();
