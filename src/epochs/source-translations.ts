import i18n from "../i18n";
import en from "../locales/sources-en.json";
import fr from "../locales/sources-fr.json";

// Source prose and its translations stay inside the deferred sources module.
i18n.addResourceBundle("en", "sources", en);
i18n.addResourceBundle("fr", "sources", fr);
