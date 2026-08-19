"use strict";
/* CONFIGURATION */
var TURNSTILE_SITE_KEY = "0x4AAAAAAEMBuCuJR8GcAZND";
var turnstileWidgetId = null;
var turnstileScriptLoading = false;
var turnstileScriptLoaded = false;
var turnstileRendered = false;
/* LOAD TURNSTILE SCRIPT ONLY WHEN CONTACT IS OPENED */
function loadTurnstileScript(callback) {
    if (turnstileScriptLoaded &&
        typeof window.turnstile !== "undefined"
    ) {
        callback();
        return;
    }

    /* Script is currently loading. */
    if (turnstileScriptLoading) {
        window.turnstileLoadCallbacks =
            window.turnstileLoadCallbacks || [];
        window.turnstileLoadCallbacks.push(callback);
        return;
    }

    turnstileScriptLoading = true;
    window.turnstileLoadCallbacks =
        window.turnstileLoadCallbacks || [];
    window.turnstileLoadCallbacks.push(callback);

    /* Create the script dynamically.
     * Nothing related to Turnstile is requested before this point. */
    var script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;

    script.onload = function () {
        turnstileScriptLoaded = true;
        turnstileScriptLoading = false;
        var callbacks =
            window.turnstileLoadCallbacks || [];
        window.turnstileLoadCallbacks = [];
        callbacks.forEach(function (callback) {
            callback();
        });
    };
    script.onerror = function () {
        turnstileScriptLoading = false;
        var callbacks =
            window.turnstileLoadCallbacks || [];
        window.turnstileLoadCallbacks = [];

        callbacks.forEach(function (callback) {
            callback(new Error(
                "Cloudflare Turnstile failed to load."
            ));
        });
    };
    document.head.appendChild(script);
}

/* RENDER TURNSTILE */
function renderTurnstile() {
    var container =
        document.getElementById("turnstile-widget");
    /* Contact form does not exist. */
    if (!container) {
        return;
    }
    /* Already rendered. */
    if (turnstileRendered) {
        return;
    }
    /* Turnstile API is unavailable. */
    if (typeof window.turnstile === "undefined") {
        return;
    }
    /* Desktop: normal
     * Mobile: compact
     * Existing website uses 480px as its
     * extra-small mobile breakpoint. */
    var isMobile =
        window.matchMedia(
            "(max-width: 767px)"
        ).matches;
    var widgetSize =
        isMobile
            ? "compact"
            : "normal";
    turnstileWidgetId =
        window.turnstile.render(
            "#turnstile-widget",
            {
                sitekey: TURNSTILE_SITE_KEY,
                size: widgetSize,
                theme: "auto",
                callback: function (token) {
                    /* Token is automatically inserted by Turnstile as: cf-turnstile-response */
                    var form =
                        document.getElementById(
                            "contact-form"
                        );
                    if (!form) {
                        return;
                    }
                    var button =
                        form.querySelector(
                            'button[type="submit"]'
                        );
                    if (button) {
                        button.disabled = false;
                    }
                },
                "expired-callback": function () {
                    var form =
                        document.getElementById(
                            "contact-form"
                        );
                    if (!form) {
                        return;
                    }
                    var button =
                        form.querySelector(
                            'button[type="submit"]'
                        );
                    if (button) {
                        button.disabled = true;
                    }
                },
                retry: "auto",
                "retry-interval": 8000,
                "error-callback": function (errorCode) {
                    console.error("TURNSTILE ERROR:",errorCode);
                    var form =document.getElementById("contact-form");
                    if (!form) {
                        return false;
                        }
                    var button = form.querySelector('button[type="submit"]');
                    if (button) {
                        button.disabled = true;
                        }
                    return false;
                }
            }
        );
    turnstileRendered = true;
}
/* INITIALIZE TURNSTILE */
function initializeTurnstile() {
    if (turnstileRendered) {
        return;
    }
    loadTurnstileScript(
        function () {
            renderTurnstile();
        }
    );
}
function initializeContactTurnstileObserver() {
    var contactSection =
        document.getElementById("contact");
    if (!contactSection) {
        return;
    }
    /* If Contact is already visible when the script executes. */
    if ( contactSection.classList.contains("section-show")) {
        initializeTurnstile();
    }
    /* Watch only the Contact element. */
    var observer =
        new MutationObserver(
            function (mutations) {

                mutations.forEach(
                    function (mutation) {
                        if (mutation.type !== "attributes") {
                            return;
                        }
                        if ( mutation.attributeName !== "class") {
                            return;
                        }
                        if (contactSection.classList.contains("section-show")) {
                            initializeTurnstile();
                        }
                    }
                );
            }
        );
    observer.observe(
        contactSection,
        {
            attributes: true,
            attributeFilter: ["class"]
        }
    );
}
/* START CONTACT TURNSTILE OBSERVER */
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeContactTurnstileObserver,
        {
            once: true
        }
    );
} else {
    initializeContactTurnstileObserver();
}