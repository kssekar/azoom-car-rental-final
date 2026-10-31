// ============================================================
// 1. INITIAL DATA SETUP
// ============================================================
function setupData() {
  if (!localStorage.getItem('cars')) {
    const defaultCars = [
      { id: 'EV01', name: 'Nissan Leaf', range: 270, rate: 55, img: 'images/nissan_leaf.jpeg' },
      { id: 'EV02', name: 'Tesla Model 3', range: 500, rate: 90, img: 'images/tesla_m3.jpeg' },
      { id: 'EV03', name: 'BYD Atto 3', range: 420, rate: 70, img: 'images/byd_atto3.jpeg' },
      { id: 'EV04', name: 'MG ZS EV', range: 320, rate: 60, img: 'images/mg_zs_ev.jpeg' },
      { id: 'EV05', name: 'Hyundai Ioniq 5', range: 480, rate: 85, img: 'images/hyundai_ioniq.jpeg' },
      { id: 'EV06', name: 'Kia EV6', range: 510, rate: 95, img: 'images/Kia_EV6.jpeg' }
    ];
    localStorage.setItem('cars', JSON.stringify(defaultCars));
  }

  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
      { email: 'emp1@azoom.com', pass: 'azoom123', role: 'employee', name: 'Staff One' }
    ]));
  }
  if (!localStorage.getItem('bookings')) {
    localStorage.setItem('bookings', JSON.stringify([]));
  }
}
setupData();

// ============================================================
// 2. LOGIN & AUTHENTICATION
// ============================================================
function loginUser(email, pass) {
  const users = JSON.parse(localStorage.getItem('users'));
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].pass === pass) {
      sessionStorage.setItem('loggedInUser', JSON.stringify(users[i]));
      return users[i];
    }
  }
  return null;
}

function getCurrentUser() {
  const user = sessionStorage.getItem('loggedInUser');
  if (user) return JSON.parse(user);
  return null;
}

function logout() {
  sessionStorage.removeItem('loggedInUser');
  updateNavBar();
  showPage('home');
}

function updateNavBar() {
  const user = getCurrentUser();
  const loginLink = document.getElementById('navLogin');
  const logoutLink = document.getElementById('navLogout');
  const userBadge = document.getElementById('navUser');
  const empLink = document.getElementById('navEmployee');

  if (user) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline';
    userBadge.style.display = 'inline';
    userBadge.innerText = user.name;
    if (user.role === 'employee') empLink.style.display = 'inline';
    else empLink.style.display = 'none';
  } else {
    loginLink.style.display = 'inline';
    logoutLink.style.display = 'none';
    userBadge.style.display = 'none';
    empLink.style.display = 'none';
  }
}

// ============================================================
// 3. NAVIGATION
// ============================================================
function showPage(pageName) {
  const pages = document.querySelectorAll('.page');
  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }

  const target = document.getElementById('page-' + pageName);
  if (target) target.classList.add('active');

  const links = document.querySelectorAll('#mainNav a');
  for (let i = 0; i < links.length; i++) {
    links[i].classList.remove('active');
    if (links[i].getAttribute('data-nav') === pageName) {
      links[i].classList.add('active');
    }
  }

  if (pageName === 'cars') showCars();
  if (pageName === 'booking') setupBookingForm();
  if (pageName === 'employee') {
    cancelInspection(); // Hide form if navigating back
    loadEmployeeDashboard();
  }
  if (pageName === 'finalbill') showFinalBill();
}

// ============================================================
// 4. CARS PAGE
// ============================================================
function showCars() {
  const cars = JSON.parse(localStorage.getItem('cars'));
  const maxRate = document.getElementById('maxRate').value;
  document.getElementById('rateLabel').innerText = '$' + maxRate;

  const grid = document.getElementById('carGrid');
  grid.innerHTML = '';

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    if (car.rate <= maxRate) {
      grid.innerHTML += `
        <div class="car-card">
          <img src="${car.img}" alt="${car.name}">
          <h3>${car.name}</h3>
          <p>⚡ Range: ${car.range} km</p>
          <p class="price">$${car.rate} / day</p>
          <button class="btn" onclick="bookCar('${car.id}')">Reserve</button>
        </div>
      `;
    }
  }
}

function bookCar(carId) {
  sessionStorage.setItem('preselectedCar', carId);
  showPage('booking');
}

// ============================================================
// 5. BOOKING PAGE & COST CALCULATION
// ============================================================
function setupBookingForm() {
  const cars = JSON.parse(localStorage.getItem('cars'));
  const dropdown = document.getElementById('car');
  dropdown.innerHTML = '';

  for (let i = 0; i < cars.length; i++) {
    dropdown.innerHTML += `<option value="${cars[i].id}">${cars[i].name} ($${cars[i].rate}/day)</option>`;
  }

  const pre = sessionStorage.getItem('preselectedCar');
  if (pre) dropdown.value = pre;
  sessionStorage.removeItem('preselectedCar');

  calculateCost();
}

function calculateCost() {
  const carId = document.getElementById('car').value;
  const pickup = document.getElementById('pickup').value;
  const dropoff = document.getElementById('ret').value;
  const plan = document.getElementById('plan').value;
  const cars = JSON.parse(localStorage.getItem('cars'));
  
  let selectedCar = null;
  for (let i = 0; i < cars.length; i++) {
    if (cars[i].id === carId) selectedCar = cars[i];
  }

  if (!pickup || !dropoff || new Date(dropoff) <= new Date(pickup)) {
    document.getElementById('dateError').classList.add('show');
    document.getElementById('cost').innerText = '$0.00';
    return;
  }
  document.getElementById('dateError').classList.remove('show');

  const days = Math.ceil((new Date(dropoff) - new Date(pickup)) / 86400000);
  let total = 0;

  if (plan === 'daily') {
    total = days * selectedCar.rate;
  } else if (plan === 'weekly') {
    total = Math.floor(days / 7) * selectedCar.rate * 6.5 + (days % 7) * selectedCar.rate;
  } else {
    total = Math.floor(days / 30) * selectedCar.rate * 22 + (days % 30) * selectedCar.rate;
  }

  document.getElementById('cost').innerText = '$' + total.toFixed(2);
  document.getElementById('cost').setAttribute('data-total', total);
  document.getElementById('cost').setAttribute('data-days', days);
}

function submitBooking(event) {
  event.preventDefault();
  const user = getCurrentUser();
  
  if (!user || user.role !== 'customer') {
    alert('Please log in as a customer.');
    showPage('login');
    return;
  }

  const cardNum = document.getElementById('cardNum').value;
  const expiry = document.getElementById('expiry').value;
  const cvc = document.getElementById('cvc').value;
  const cardError = document.getElementById('cardErr');

  if (cardNum.length < 13 || expiry.length < 5 || cvc.length < 3) {
    cardError.classList.add('show');
    return;
  }
  cardError.classList.remove('show');

  const cars = JSON.parse(localStorage.getItem('cars'));
  let carName = '';
  for (let i = 0; i < cars.length; i++) {
    if (cars[i].id === document.getElementById('car').value) carName = cars[i].name;
  }

  const booking = {
    ref: 'AZ' + Date.now(),
    customer: user.email,
    carName: carName,
    pickup: document.getElementById('pickup').value,
    ret: document.getElementById('ret').value,
    rentalCost: Number(document.getElementById('cost').getAttribute('data-total')),
    damages: 0,
    status: 'reserved'
  };

  const allBookings = JSON.parse(localStorage.getItem('bookings'));
  allBookings.push(booking);
  localStorage.setItem('bookings', JSON.stringify(allBookings));

  sessionStorage.setItem('lastBooking', JSON.stringify(booking));
  document.getElementById('bookingForm').reset();
  showPage('confirmation');
  fillConfirmationTable();
}

// ============================================================
// 6. CONFIRMATION PAGE
// ============================================================
function fillConfirmationTable() {
  const booking = JSON.parse(sessionStorage.getItem('lastBooking'));
  const table = document.getElementById('confirmBody');
  
  if (!booking) {
    table.innerHTML = '<tr><td>No booking found.</td></tr>';
    return;
  }

  table.innerHTML = `
    <tr><td>Reference:</td><td>${booking.ref}</td></tr>
    <tr><td>Car:</td><td>${booking.carName}</td></tr>
    <tr><td>Pickup Date:</td><td>${booking.pickup}</td></tr>
    <tr><td>Return Date:</td><td>${booking.ret}</td></tr>
    <tr><td>Cost:</td><td><strong>$${booking.rentalCost}</strong></td></tr>
  `;
}

// ============================================================
// 7. EMPLOYEE DASHBOARD & INSPECTION
// ============================================================
let currentInspectingRef = null;

function loadEmployeeDashboard() {
  const bookings = JSON.parse(localStorage.getItem('bookings'));
  const table = document.getElementById('empBookingRows');
  const emptyMsg = document.getElementById('empEmpty');
  table.innerHTML = '';

  if (!bookings || bookings.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];

    let actionCell;
    if (b.status === 'reserved') {
      actionCell = `<button class="btn small" onclick="startInspection('${b.ref}')">Inspect</button>`;
    } else if (b.status === 'returned') {
      actionCell = `<span class="muted">Awaiting payment</span>`;
    } else if (b.status === 'paid') {
      actionCell = `<span class="pill paid">Paid</span>`;
    } else {
      actionCell = '';
    }

    const customerCell = (b.status === 'paid') ? '<span class="muted">—</span>' : b.customer;

    table.innerHTML += `
      <tr>
        <td>${b.ref}</td>
        <td>${customerCell}</td>
        <td>${b.carName}</td>
        <td><span class="pill ${b.status}">${b.status}</span></td>
        <td>${actionCell}</td>
      </tr>
    `;
  }
}

function startInspection(ref) {
  const bookings = JSON.parse(localStorage.getItem('bookings'));
  const target = bookings.find(b => b.ref === ref);

  if (!target) {
    alert('Booking not found.');
    return;
  }
  if (target.status !== 'reserved') {
    alert('This booking has already been inspected.');
    return;
  }

  currentInspectingRef = ref;
  document.getElementById('inspectRefLabel').innerText = ref;
  
  // Reset form to default state
  document.getElementById('damageType').value = "0";
  document.getElementById('damageInput').value = "0";
  document.getElementById('customDamageContainer').classList.add('hidden');
  
  document.getElementById('inspectionBox').classList.remove('hidden');
  document.getElementById('inspectionBox').scrollIntoView({ behavior: 'smooth' });
}

function toggleCustomDamage() {
  const type = document.getElementById('damageType').value;
  const container = document.getElementById('customDamageContainer');
  if (type === 'custom') {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
}

function cancelInspection() {
  currentInspectingRef = null;
  document.getElementById('inspectionBox').classList.add('hidden');
}

function saveInspection() {
  if (!currentInspectingRef) return;

  const typeSelection = document.getElementById('damageType').value;
  let damageCost = 0;

  if (typeSelection === 'custom') {
    const customInput = document.getElementById('damageInput').value;
    damageCost = Number(customInput) || 0;
  } else {
    damageCost = Number(typeSelection) || 0;
  }

  const bookings = JSON.parse(localStorage.getItem('bookings'));
  const target = bookings.find(b => b.ref === currentInspectingRef);

  if (!target) return;

  target.damages = damageCost;
  target.status = 'returned';

  localStorage.setItem('bookings', JSON.stringify(bookings));
  sessionStorage.setItem('lastBooking', JSON.stringify(target));
  
  cancelInspection();
  showPage('finalbill');
  showFinalBill();
}

// ============================================================
// 8. FINAL BILL PAGE
// ============================================================
function showFinalBill() {
  const booking = JSON.parse(sessionStorage.getItem('lastBooking'));
  const table = document.getElementById('billBody');
  
  if (!booking) return;

  if (booking.status === 'paid') {
    table.innerHTML = '<tr><td colspan="2">This booking has already been paid.</td></tr>';
    return;
  }

  const total = booking.rentalCost + booking.damages;
  table.innerHTML = `
    <tr><td>Car:</td><td>${booking.carName}</td></tr>
    <tr><td>Rental:</td><td>$${booking.rentalCost}</td></tr>
    <tr><td>Damages:</td><td>$${booking.damages}</td></tr>
    <tr><td><strong>Total:</strong></td><td><strong>$${total}</strong></td></tr>
  `;
}

function payFinalBill(event) {
  event.preventDefault();
  const booking = JSON.parse(sessionStorage.getItem('lastBooking'));
  
  if (!booking) {
    alert('No booking to pay for.');
    return;
  }

  const allBookings = JSON.parse(localStorage.getItem('bookings'));
  const stored = allBookings.find(b => b.ref === booking.ref);

  if (!stored) {
    alert('Booking not found.');
    return;
  }
  if (stored.status === 'paid') {
    alert('This booking has already been paid.');
    sessionStorage.removeItem('lastBooking');
    showPage('home');
    return;
  }

  stored.status = 'paid';
  stored.damages = stored.damages || 0;
  localStorage.setItem('bookings', JSON.stringify(allBookings));
  
  alert('Payment successful!');
  sessionStorage.removeItem('lastBooking');
  showPage('home');
}

// ============================================================
// 9. LOGIN / REGISTER / BOOT
// ============================================================
function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  const user = loginUser(email, pass);

  if (user) {
    updateNavBar();
    if (user.role === 'employee') showPage('employee');
    else showPage('home');
  } else {
    document.getElementById('loginErr').classList.add('show');
  }
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;

  const users = JSON.parse(localStorage.getItem('users'));
  users.push({ email: email, pass: pass, role: 'customer', name: name });
  localStorage.setItem('users', JSON.stringify(users));

  alert('Registered! Please log in.');
  showPage('login');
}

// Boot the app when the page loads
window.onload = function() {
  updateNavBar();
  showPage('home');
};  
