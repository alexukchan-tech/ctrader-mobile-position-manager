const positionsTab = document.getElementById("positionsTab");
const ordersTab = document.getElementById("ordersTab");

const positionsView = document.getElementById("positionsView");
const ordersView = document.getElementById("ordersView");

function showPositions() {
    positionsTab.classList.add("active");
    ordersTab.classList.remove("active");

    positionsView.classList.remove("hidden");
    ordersView.classList.add("hidden");
}

function showPendingOrders() {
    positionsTab.classList.remove("active");
    ordersTab.classList.add("active");

    positionsView.classList.add("hidden");
    ordersView.classList.remove("hidden");
}

positionsTab.addEventListener("click", showPositions);
ordersTab.addEventListener("click", showPendingOrders);
