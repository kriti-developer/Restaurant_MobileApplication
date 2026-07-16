# FoodExpress Restaurant

A React Native (Expo) app for restaurant owners/staff to manage their menu
and live orders on the go — the mobile companion to
[`restaurant-dashboard.html`](https://github.com/Tejas-gh/realtime-food-ordering),
built to match the stack of the
[customer](https://github.com/kriti-developer/FoodDelivery_CustomerMobileApp) and
[rider](https://github.com/kriti-developer/FoodDelivery_RiderMobileApp) apps
in the same family.

Talks to the shared backend
([`Tejas-gh/realtime-food-ordering`](https://github.com/Tejas-gh/realtime-food-ordering))
over REST + Socket.IO.

## Tech Stack

- Expo (React Native, JavaScript)
- React Navigation — native-stack (auth) + bottom-tabs (main app)
- AsyncStorage for on-device session persistence
- `socket.io-client` for live order/menu updates

## Features

- **Auth** — restaurant owner sign up (creates a new restaurant + owner
  account) and login, JWT-backed
- **Orders** — Active / All / Delivered / Cancelled tabs; Accept Order
  (pending → preparing) and Ready for Pickup (preparing → ready) actions;
  updates arrive instantly via Socket.IO
- **Menu** — search, Live/Hidden filters, add a dish, toggle an item live
  or hidden
- **Overview** — menu and order stats at a glance
- **Restaurant Info** — restaurant + account details, logout

## Project Structure

```
App.js                          Entry point (SafeAreaProvider + AppProvider + RootNavigator)
src/
  config.js                     API_BASE
  theme/colors.js                Shared color palette
  context/AppContext.js          Auth, menu items, orders, Socket.IO connection
  navigation/index.js             Auth stack vs. main bottom tabs
  components/PrimaryButton.js
  screens/
    LoginScreen.js
    SignupScreen.js
    OrdersScreen.js
    MenuScreen.js
    OverviewScreen.js
    RestaurantInfoScreen.js
```

## Running the App

### 1. Start the backend

In the backend repo (`Tejas-gh/realtime-food-ordering`):

```
cd backend
npm install
npm run seed
npm start
```

Leave this running in its own terminal — it listens on port 4000 by default.

### 2. Point the app at the backend

Edit `src/config.js`:

```js
export const API_BASE = "http://<host>:<port>";
```

- **Android emulator:** use `http://10.0.2.2:4000`.
- **Physical phone (Expo Go):** use your computer's LAN IP, e.g.
  `http://192.168.0.5:4000`. Find it on Windows with `ipconfig` → "IPv4
  Address" under your active Wi-Fi adapter. The phone and computer must be
  on the same Wi-Fi network. Use the same value the customer/rider apps
  point at, since all three talk to one backend instance.

### 3. Install and run

```
npm install
npm start
```

Open the QR code with Expo Go on your phone.

## Golden Path

1. Register a new restaurant owner account (Sign Up tab on the login screen).
2. Lands on the Orders tab (empty at first).
3. Go to the Menu tab → "+ Add Dish" → set it live.
4. Confirm the dish shows up in the customer app's live item view.
5. Place an order from the customer app — it appears instantly on the
   Orders tab (Socket.IO `order:new`).
6. Tap "Accept Order", then "Ready for Pickup" — status updates propagate
   in real time to the rider and customer apps.
