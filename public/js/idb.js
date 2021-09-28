// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_helper' and set it to version 1
const request = indexedDB.open("budget_helper", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_transact", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransact();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transact"], "readwrite");

  // access the object store for `new_transact`
  const pizzaObjectStore = transaction.objectStore("new_transact");

  // add record to your store with add method.
  pizzaObjectStore.add(record);
}

function uploadTransact() {
  // open a transaction on your pending db
  const transaction = db.transaction(["new_transact"], "readwrite");

  // access your pending object store
  const pizzaObjectStore = transaction.objectStore("new_transact");

  // get all records from store and set to a variable
  const getAll = pizzaObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/pizzas", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transact"], "readwrite");
          // access the new_pizza object store
          const pizzaObjectStore = transaction.objectStore("new_transact");
          // clear all items in your store
          pizzaObjectStore.clear();

          alert("All saved transactions has been submitted!");
        })
        .catch((err) => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadTransact);
