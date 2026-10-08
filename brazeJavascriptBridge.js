/**
 * Braze JavaScript Bridge for Flutter WebView
 * Version 1.1.0 — keep in step with BrazeJavascriptBridge.VERSION and the
 * readme's changelog; a copy hosted elsewhere is identified by this number.
 *
 * This bridge provides the same interface as the Braze Web SDK,
 * but forwards all calls to the native Braze SDK through Flutter's WebView handler.
 */
class BrazeJavascriptBridge {
    constructor() {
        this.version = BrazeJavascriptBridge.VERSION;
        this.handlerName = 'brazeHandler';
        this.initialized = false;
        // True once a platform-ready listener is registered, so repeated
        // calls before the plugin loads add (and warn) only once.
        this.waitingForPlatform = false;

        // Initialize the bridge
        this.init();
    }

    /**
     * The object the Flutter WebView plugin injects into the page.
     * zikzak_inappwebview (a fork of flutter_inappwebview) injects
     * `window.zikzak_inappwebview`; flutter_inappwebview injects
     * `window.flutter_inappwebview`. Both expose the same `callHandler`.
     */
    nativeBridge() {
        if (typeof window === 'undefined') {
            return null;
        }
        return window.zikzak_inappwebview || window.flutter_inappwebview || null;
    }

    /**
     * Initialize the bridge
     */
    init() {
        if (this.initialized) {
            return;
        }

        // Check if we're in a Flutter WebView environment
        if (this.nativeBridge()) {
            this.initialized = true;
            console.log(`Braze JavaScript Bridge v${this.version} initialized`);
        } else if (!this.waitingForPlatform) {
            console.warn(`Braze JavaScript Bridge v${this.version}: Flutter WebView not detected`);
            // Both plugins fire this once their bridge is ready; try again then
            // instead of staying uninitialized for the life of the page.
            if (typeof window !== 'undefined' && window.addEventListener) {
                this.waitingForPlatform = true;
                window.addEventListener('flutterInAppWebViewPlatformReady', () => this.init(), { once: true });
            }
        }
    }

    /**
     * Send message to Flutter native layer
     */
    async sendToNative(method, data) {
        var result = null;
        this.init();
        if (!this.initialized) {
            result = { "success": false, "message": "Braze JavaScript Bridge: Not initialized" };
            return JSON.stringify(result);
        }

        try {
            const message = {
                method: method,
                data: data,
                timestamp: Date.now()
            };

            // Send to Flutter WebView handler
            const bridge = this.nativeBridge();
            if (bridge && bridge.callHandler) {
                result = await bridge.callHandler(this.handlerName, message);
            } else {
                result = { "success": false, "message": "Braze JavaScript Bridge: Flutter handler not available" };
            }
        } catch (error) {
            result = { "success": false, "message": error.message || "Braze JavaScript Bridge: Unknown error" };
        }
        return JSON.stringify(result);
    }

    /**
     * Log a custom event
     * @param {string} eventName - Name of the event
     * @param {Object} properties - Event properties (optional)
     */
    async logCustomEvent(eventName, properties = {}) {
        if (!eventName || typeof eventName !== 'string') {
            console.error('Braze JavaScript Bridge: Event name is required and must be a string');
            return;
        }

        return await this.sendToNative('logCustomEvent', {
            eventName: eventName,
            properties: properties || {}
        });
    }

    /**
     * Log a purchase
     * @param {string} productId - Product identifier
     * @param {number} price - Price of the product
     * @param {string} currency - Currency code (e.g., 'USD')
     * @param {number} quantity - Quantity purchased (optional, defaults to 1)
     * @param {Object} properties - Purchase properties (optional)
     */
    async logPurchase(productId, price, currency, quantity = 1, properties = {}) {
        if (!productId || typeof productId !== 'string') {
            console.error('Braze JavaScript Bridge: Product ID is required and must be a string');
            return;
        }

        if (typeof price !== 'number' || price < 0) {
            console.error('Braze JavaScript Bridge: Price must be a positive number');
            return;
        }

        if (!currency || typeof currency !== 'string') {
            console.error('Braze JavaScript Bridge: Currency is required and must be a string');
            return;
        }

        if (typeof quantity !== 'number' || quantity < 1) {
            console.error('Braze JavaScript Bridge: Quantity must be a positive number');
            return;
        }

        return await this.sendToNative('logPurchase', {
            productId: productId,
            price: price,
            currency: currency.toUpperCase(),
            quantity: quantity,
            properties: properties || {}
        });
    }


}

// Assigned rather than declared as a static class field, so older WebViews
// without class-field support still load the bridge.
BrazeJavascriptBridge.VERSION = '1.1.0';

// Create global braze instance
window.braze = new BrazeJavascriptBridge();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrazeJavascriptBridge;
}