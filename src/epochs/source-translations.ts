import i18n from "../i18n";
import en from "../locales/sources-en.json";
import fr from "../locales/sources-fr.json";
import ru from "../locales/sources-ru.json";

// Source prose and its translations stay inside the deferred sources module.
i18n.addResourceBundle("en", "sources", en);
i18n.addResourceBundle("fr", "sources", fr);
i18n.addResourceBundle("ru", "sources", ru);
