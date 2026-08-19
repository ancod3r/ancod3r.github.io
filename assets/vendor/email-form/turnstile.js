"use strict";
var TURNSTILE_SITE_KEY = "0x4AAAAAAEMBuCuJR8GcAZND";
var turnstileWidgetId = null;
var turnstileScriptLoading = false;
var turnstileScriptLoaded = false;
var turnstileRendered = false;
function loadTurnstileScript(callback) {
    if (turnstileScriptLoaded &&
        typeof window.turnstile !== "undefined"
    ) {
        callback();
        return;
    }

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
function renderTurnstile() {
    var container =
        document.getElementById("turnstile-widget");
    if (!container) {
        return;
    }
    if (turnstileRendered) {
        return;
    }
    if (typeof window.turnstile === "undefined") {
        return;
    }
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
    if ( contactSection.classList.contains("section-show")) {
        initializeTurnstile();
    }
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