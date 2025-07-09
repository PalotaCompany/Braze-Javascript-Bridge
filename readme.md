# Braze JavaScript Bridge Example for Flutter WebView

This example demonstrates how to create a JavaScript bridge that allows web content running in a Flutter WebView to interact with the Braze SDK through the native layer. The bridge provides the same interface as the Braze Web SDK, making it easy for web developers to integrate with Braze functionality without changing their existing code.

## Overview

The Braze JavaScript Bridge acts as a proxy between web content and the native Braze SDK. Instead of directly calling Braze's web services, the bridge forwards all calls to Flutter's native layer where the actual Braze SDK handles the requests.

### Benefits

- **Familiar Interface**: Uses the same API as the Braze Web SDK
- **Native Performance**: Leverages the native Braze SDK for optimal performance
- **Unified Data**: All user data flows through the native SDK, ensuring consistency
- **Offline Support**: Benefits from native SDK's offline capabilities
- **Single Integration**: No need to integrate both web and native SDKs

## Architecture

```
Web Content (HTML/JS)
      ↓
Braze JavaScript Bridge
      ↓
Flutter WebView Handler
      ↓
Native Braze SDK
      ↓
Braze Platform
```

## Implementation

### 1. JavaScript Bridge (`brazeJavascriptBridge.js`)

The bridge provides a JavaScript interface to call logCustomEvent and logPurcahse.

```javascript


// Log custom event
braze.logCustomEvent('button_clicked', {
    button_name: 'signup',
    page: 'homepage'
});

// Log purchase
braze.logPurchase('product_123', 29.99, 'USD', 1, {
    category: 'clothing',
    brand: 'example'
});
```

### 2. Flutter WebView Integration

In your Flutter app, you'll need to handle the bridge messages:

```dart
// Example Flutter handler for flutter_inappwebview
InAppWebViewController? webViewController;

// Add handler for Braze bridge messages
webViewController?.addJavaScriptHandler(
  handlerName: 'brazeHandler',
  callback: (args) {
    final method = args[0]['method'];
    final data = args[0]['data'];
    
    switch (method) {
      case 'logCustomEvent':
        _handleLogCustomEvent(data);
        break;
      case 'logPurchase':
        _handleLogPurchase(data);
        break;
      case 'setCustomUserAttribute':
        _handleSetCustomUserAttribute(data);
        break;
      // ... handle other methods
    }
  },
);

void _handleLogCustomEvent(Map<String, dynamic> data) {
  final eventName = data['eventName'];
  final properties = data['properties'];
  
  // Forward to native Braze SDK
  BrazePlugin.logCustomEvent(eventName, properties: properties);
}

void _handleLogPurchase(Map<String, dynamic> data) {
  final productId = data['productId'];
  final price = data['price'];
  final currency = data['currency'];
  final quantity = data['quantity'];
  final properties = data['properties'];
  
  // Forward to native Braze SDK
  BrazePlugin.logPurchase(
    productId,
    currency,
    price,
    quantity,
    properties: properties,
  );
}

void _handleSetCustomUserAttribute(Map<String, dynamic> data) {
  final key = data['key'];
  final value = data['value'];
  
  // Forward to native Braze SDK
  BrazePlugin.setCustomUserAttribute(key, value);
}
```

### 3. HTML Integration

Include the bridge script in your HTML content:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="braze-api-key" content="YOUR-API-KEY">
    <script src="brazeJavascriptBridge.js"></script>
</head>
<body>
    <script>
        
        // Track page view
        braze.logCustomEvent('page_view', {
            page: 'product_details',
            product_id: '123'
        });
        
        // Handle user interactions
        document.getElementById('purchaseBtn').addEventListener('click', function() {
            braze.logPurchase('product_123', 29.99, 'USD', 1);
        });
        
    </script>
</body>
</html>
```

## Supported Methods

The bridge currently implements the following Braze Web SDK methods:

### Event Tracking
- `braze.logCustomEvent(eventName, properties)` - Log custom events
- `braze.logPurchase(productId, price, currency, quantity, properties)` - Log purchases


## Message Flow

1. **Web Content** calls a Braze method (e.g., `braze.logCustomEvent()`)
2. **JavaScript Bridge** captures the call and formats it for native communication
3. **Flutter Handler** receives the message and extracts method/data
4. **Native Braze SDK** processes the request using the appropriate native API
5. **Response** (if any) can be sent back through the bridge

## Testing

Test the bridge by opening your WebView and checking the console:

```javascript
// Test event logging
braze.logCustomEvent('test_event', { source: 'bridge_test' });

// Test purchase
braze.logPurchase('test_product', 9.99, 'USD', 1);
```


## Limitations

- Advanced features like in-app messages and push notifications require additional bridge methods
- Real-time messaging features may need bi-directional communication