import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptTranslations from './locales/pt.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            pt: {
                translation: ptTranslations
            }
        },
        lng: 'pt',
        fallbackLng: 'pt',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
