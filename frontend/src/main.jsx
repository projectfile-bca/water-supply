import React from "react";
import ReactDOM from "react-dom/client";
import {
  CheckCircle2,
  Droplets,
  FileImage,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  PackagePlus,
  Save,
  Sun,
  UserPlus,
  UploadCloud,
  XCircle
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

const initialLoginForm = { loginId: "", password: "" };
const initialCustomerForm = { name: "", phone: "", email: "", password: "" };
const initialDriverForm = { name: "", phone: "", email: "", password: "" };
const initialAdminForm = { username: "", currentPassword: "", newPassword: "" };
const initialOrderForm = {
  deliveryAddress: "",
  quantityOption: "2000",
  customLitres: "",
  notes: ""
};

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function App() {
  const [activeView, setActiveView] = React.useState("login");
  const [signupRole, setSignupRole] = React.useState("customer");
  const [currentUser, setCurrentUser] = React.useState(null);
  const [theme, setTheme] = React.useState(() => localStorage.getItem("theme") || "light");

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(apiUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setCurrentUser(data.user))
      .catch(() => localStorage.removeItem("token"));
  }, []);

  function handleLogin({ token, user }) {
    localStorage.setItem("token", token);
    setCurrentUser(user);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setActiveView("login");
  }

  if (currentUser) {
    return (
      <main className="page-shell">
        <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
        <section className="application-panel">
          <Dashboard user={currentUser} onLogout={handleLogout} onUserChange={setCurrentUser} />
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
      <section className="application-panel">
        <div className="home-hero">
          <span className="avatar-mark hero-mark">
            <Droplets size={28} />
          </span>
          <div className="panel-heading">
            <p>Water delivery platform</p>
            <h1>Fresh water orders, driver approvals, and delivery tracking.</h1>
          </div>
        </div>

        <div className="role-tabs">
          <button type="button" className={activeView === "login" ? "active" : ""} onClick={() => setActiveView("login")}>
            Login
          </button>
          <button type="button" className={activeView === "signup" ? "active" : ""} onClick={() => setActiveView("signup")}>
            Signup
          </button>
        </div>

        {activeView === "login" && <LoginForm onLogin={handleLogin} />}
        {activeView === "signup" && (
          <SignupPanel signupRole={signupRole} onRoleChange={setSignupRole} />
        )}
      </section>
    </main>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button type="button" className="theme-toggle" onClick={onToggle} aria-label="Toggle dark mode">
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

function SignupPanel({ signupRole, onRoleChange }) {
  return (
    <div className="dashboard-stack">
      <div className="signup-role-card">
        <SectionTitle
          title="Choose signup role"
          caption="Customers can order immediately. Drivers submit documents and wait for admin approval."
        />
        <div className="role-tabs compact-tabs">
          <button type="button" className={signupRole === "customer" ? "active" : ""} onClick={() => onRoleChange("customer")}>
            Customer
          </button>
          <button type="button" className={signupRole === "driver" ? "active" : ""} onClick={() => onRoleChange("driver")}>
            Driver
          </button>
        </div>
      </div>
      {signupRole === "customer" ? <CustomerRegistrationForm /> : <DriverApplicationForm />}
    </div>
  );
}

function Dashboard({ user, onLogout, onUserChange }) {
  return (
    <>
      <div className="dashboard-header">
        <div className="panel-heading">
          <p>{user.role} dashboard</p>
          <h1>Welcome, {user.name}</h1>
        </div>
        <button type="button" className="secondary-button" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <div className="user-summary profile-strip">
        <span className="avatar-mark">
          <Droplets size={22} />
        </span>
        <span>
          <strong>{user.email || user.username}</strong>
          <small>Role: {user.role}</small>
        </span>
        <StatusBadge status={user.isApproved ? "approved" : "pending approval"} />
      </div>

      {user.role === "customer" && <CustomerOrderForm />}
      {user.role === "driver" && <DriverOrderBoard user={user} />}
      {user.role === "admin" && <AdminDashboard user={user} onUserChange={onUserChange} />}
    </>
  );
}

function LoginForm({ onLogin }) {
  const [form, setForm] = React.useState(initialLoginForm);
  const [status, setStatus] = React.useState({ type: "idle", message: "" });

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitLogin(event) {
    event.preventDefault();
    try {
      setStatus({ type: "loading", message: "Checking account..." });
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.loginId, password: form.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed.");
      setForm(initialLoginForm);
      onLogin(data);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <form className="application-form" onSubmit={submitLogin}>
      <div className="field-grid">
        <label>
          Username or email
          <input name="loginId" value={form.loginId} onChange={updateField} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} required />
        </label>
      </div>
      <StatusMessage status={status} />
      <button type="submit" className="submit-button" disabled={status.type === "loading"}>
        {status.type === "loading" ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
        Login
      </button>
    </form>
  );
}

function CustomerRegistrationForm() {
  const [form, setForm] = React.useState(initialCustomerForm);
  const [status, setStatus] = React.useState({ type: "idle", message: "" });

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitCustomer(event) {
    event.preventDefault();
    try {
      setStatus({ type: "loading", message: "Creating customer account..." });
      const response = await fetch(apiUrl("/auth/register-customer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Customer registration failed.");
      setForm(initialCustomerForm);
      setStatus({ type: "success", message: "Customer account created. You can log in immediately." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <form className="application-form" onSubmit={submitCustomer}>
      <div className="field-grid">
        <TextInput label="Name" name="name" value={form.name} onChange={updateField} />
        <TextInput label="Phone" name="phone" value={form.phone} onChange={updateField} />
        <TextInput label="Email" name="email" type="email" value={form.email} onChange={updateField} />
        <TextInput label="Password" name="password" type="password" minLength="6" value={form.password} onChange={updateField} />
      </div>
      <StatusMessage status={status} />
      <button type="submit" className="submit-button" disabled={status.type === "loading"}>
        {status.type === "loading" ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
        Create customer
      </button>
    </form>
  );
}

function DriverApplicationForm() {
  const [form, setForm] = React.useState(initialDriverForm);
  const [files, setFiles] = React.useState({ aadhaar: null, license: null });
  const [previews, setPreviews] = React.useState({ aadhaar: "", license: "" });
  const [status, setStatus] = React.useState({ type: "idle", message: "" });

  React.useEffect(() => {
    return () => {
      Object.values(previews).forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateFile(field, file) {
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setStatus({ type: "error", message: "Only jpg, jpeg, and png image files are allowed." });
      return;
    }
    setFiles((current) => ({ ...current, [field]: file }));
    setPreviews((current) => {
      if (current[field]) URL.revokeObjectURL(current[field]);
      return { ...current, [field]: URL.createObjectURL(file) };
    });
  }

  async function uploadImage(file) {
    const body = new FormData();
    body.append("image", file);
    const response = await fetch(apiUrl("/upload"), { method: "POST", body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Image upload failed.");
    return data.secure_url;
  }

  async function submitApplication(event) {
    event.preventDefault();
    if (!files.aadhaar || !files.license) {
      setStatus({ type: "error", message: "Please upload both Aadhaar and Driving License images." });
      return;
    }

    try {
      setStatus({ type: "loading", message: "Uploading documents..." });
      const [aadhaarUrl, licenseUrl] = await Promise.all([
        uploadImage(files.aadhaar),
        uploadImage(files.license)
      ]);
      setStatus({ type: "loading", message: "Submitting application..." });
      const response = await fetch(apiUrl("/drivers/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, aadhaarUrl, licenseUrl })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Application submission failed.");
      setForm(initialDriverForm);
      setFiles({ aadhaar: null, license: null });
      setPreviews({ aadhaar: "", license: "" });
      setStatus({ type: "success", message: "Application submitted. Your access unlocks after admin approval." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <form className="application-form" onSubmit={submitApplication}>
      <div className="field-grid">
        <TextInput label="Name" name="name" value={form.name} onChange={updateField} />
        <TextInput label="Phone" name="phone" value={form.phone} onChange={updateField} />
        <TextInput label="Email" name="email" type="email" value={form.email} onChange={updateField} wide />
        <TextInput label="Password" name="password" type="password" minLength="6" value={form.password} onChange={updateField} wide />
      </div>
      <div className="upload-grid">
        <DocumentUpload id="aadhaar" title="Aadhaar image" file={files.aadhaar} preview={previews.aadhaar} onChange={(file) => updateFile("aadhaar", file)} />
        <DocumentUpload id="license" title="Driving License image" file={files.license} preview={previews.license} onChange={(file) => updateFile("license", file)} />
      </div>
      <StatusMessage status={status} />
      <button type="submit" className="submit-button" disabled={status.type === "loading"}>
        {status.type === "loading" ? <Loader2 size={18} className="spin" /> : <UploadCloud size={18} />}
        Submit driver application
      </button>
    </form>
  );
}

function AdminDashboard({ user, onUserChange }) {
  const [drivers, setDrivers] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [generatedKeys, setGeneratedKeys] = React.useState({});
  const [orderFilter, setOrderFilter] = React.useState("all");
  const [form, setForm] = React.useState({ ...initialAdminForm, username: user.username || user.name });
  const [status, setStatus] = React.useState({ type: "idle", message: "" });

  React.useEffect(() => {
    loadAdminData();
  }, []);

  async function adminFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    const response = await fetch(apiUrl(url), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Admin request failed.");
    return data;
  }

  async function loadAdminData() {
    try {
      const [driversData, ordersData] = await Promise.all([
        adminFetch("/admin/drivers/pending"),
        adminFetch("/admin/orders")
      ]);
      setDrivers(driversData.drivers);
      setOrders(ordersData.orders);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function approveDriver(driverId) {
    try {
      setStatus({ type: "loading", message: "Approving driver..." });
      await adminFetch(`/admin/drivers/${driverId}/approve`, { method: "PATCH", body: JSON.stringify({}) });
      await loadAdminData();
      setStatus({ type: "success", message: "Driver approved." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function approveOrderRequest(orderId, driverId) {
    try {
      setStatus({ type: "loading", message: "Approving order request..." });
      const data = await adminFetch(`/admin/orders/${orderId}/approve-request`, {
        method: "PATCH",
        body: JSON.stringify({ driverId })
      });
      setOrders((current) => current.map((order) => (order._id === data.order._id ? data.order : order)));
      setStatus({ type: "success", message: "Order assigned to driver." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function generateDeliveryKey(orderId) {
    try {
      setStatus({ type: "loading", message: "Generating delivery key..." });
      const data = await adminFetch(`/admin/orders/${orderId}/generate-delivery-key`, {
        method: "PATCH",
        body: JSON.stringify({})
      });
      setGeneratedKeys((current) => ({ ...current, [orderId]: data.deliveryKey }));
      setOrders((current) => current.map((order) => (order._id === data.order._id ? data.order : order)));
      setStatus({ type: "success", message: "Delivery key generated." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function updateAdmin(event) {
    event.preventDefault();
    try {
      setStatus({ type: "loading", message: "Updating admin account..." });
      const data = await adminFetch("/admin/profile", {
        method: "PATCH",
        body: JSON.stringify(form)
      });
      setForm({ ...initialAdminForm, username: data.admin.username });
      onUserChange((current) => ({ ...current, name: data.admin.username, username: data.admin.username }));
      setStatus({ type: "success", message: "Admin account updated." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  const filteredOrders = orderFilter === "all" ? orders : orders.filter((order) => order.status === orderFilter);
  const stats = {
    total: orders.length,
    pending: orders.filter((order) => ["pending", "requested"].includes(order.status)).length,
    active: orders.filter((order) => ["assigned", "out_for_delivery"].includes(order.status)).length,
    completed: orders.filter((order) => order.status === "completed").length,
    litres: orders.filter((order) => order.status === "completed").reduce((sum, order) => sum + Number(order.litres || 0), 0)
  };

  return (
    <div className="dashboard-stack">
      <div className="stat-grid">
        <StatCard label="Total orders" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Litres delivered" value={`${stats.litres}L`} />
      </div>

      <form className="application-form" onSubmit={updateAdmin}>
        <div className="field-grid">
          <TextInput label="Admin username" name="username" value={form.username} onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))} />
          <TextInput label="Current password" name="currentPassword" type="password" value={form.currentPassword} onChange={(e) => setForm((c) => ({ ...c, currentPassword: e.target.value }))} />
          <TextInput label="New password" name="newPassword" type="password" value={form.newPassword} onChange={(e) => setForm((c) => ({ ...c, newPassword: e.target.value }))} wide />
        </div>
        <StatusMessage status={status} />
        <button type="submit" className="submit-button" disabled={status.type === "loading"}>
          {status.type === "loading" ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
          Update admin
        </button>
      </form>

      <div className="orders-list">
        <SectionTitle title="Pending driver approvals" caption="Review documents before enabling driver access." />
        {drivers.length === 0 ? <p>No pending drivers.</p> : drivers.map((driver) => (
          <article className="order-item" key={driver._id}>
            <div className="item-head"><strong>{driver.name}</strong><StatusBadge status="pending approval" /></div>
            <div className="detail-grid"><span>Email: {driver.email}</span><span>Phone: {driver.phone}</span></div>
            <a href={driver.documents.aadhaarUrl} target="_blank" rel="noreferrer">View Aadhaar</a>
            <a href={driver.documents.licenseUrl} target="_blank" rel="noreferrer">View Driving License</a>
            <button type="button" className="inline-action" onClick={() => approveDriver(driver._id)}><CheckCircle2 size={17} />Approve driver</button>
          </article>
        ))}
      </div>

      <div className="orders-list">
        <SectionTitle title="All customer orders" caption="Track requests, driver interest, delivery keys, and completion." />
        <div className="filter-row">
          {["all", "pending", "requested", "assigned", "out_for_delivery", "completed", "cancelled"].map((filter) => (
            <button type="button" className={orderFilter === filter ? "active" : ""} key={filter} onClick={() => setOrderFilter(filter)}>
              {filter.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        {filteredOrders.length === 0 ? <p>No customer orders yet.</p> : filteredOrders.map((order) => (
          <OrderCard key={order._id} order={order}>
            {!order.driver && <span>Driver requests: {order.driverRequests?.length || 0}</span>}
            {!order.driver && order.driverRequests?.map((driver) => (
              <button type="button" className="inline-action" key={driver._id} onClick={() => approveOrderRequest(order._id, driver._id)}>
                <CheckCircle2 size={17} />Approve {driver.name}
              </button>
            ))}
            {order.status === "assigned" && (
              <button type="button" className="inline-action" onClick={() => generateDeliveryKey(order._id)}>
                <Save size={17} />Generate delivery key
              </button>
            )}
            {generatedKeys[order._id] && <span className="delivery-key">Delivery key: {generatedKeys[order._id]}</span>}
          </OrderCard>
        ))}
      </div>
    </div>
  );
}

function CustomerOrderForm() {
  const [form, setForm] = React.useState(initialOrderForm);
  const [orders, setOrders] = React.useState([]);
  const [deliveryKeys, setDeliveryKeys] = React.useState({});
  const [status, setStatus] = React.useState({ type: "idle", message: "" });

  React.useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/orders/mine"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load orders.");
      setOrders(data.orders);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    try {
      setStatus({ type: "loading", message: "Creating order..." });
      const token = localStorage.getItem("token");
      const litres = form.quantityOption === "more" ? form.customLitres : form.quantityOption;
      const response = await fetch(apiUrl("/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveryAddress: form.deliveryAddress, litres, notes: form.notes })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Order creation failed.");
      setOrders((current) => [data.order, ...current]);
      setForm(initialOrderForm);
      setStatus({ type: "success", message: "Order created successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  function repeatOrder(order) {
    setForm({
      deliveryAddress: order.deliveryAddress,
      quantityOption: ["2000", "5000"].includes(String(order.litres)) ? String(order.litres) : "more",
      customLitres: ["2000", "5000"].includes(String(order.litres)) ? "" : String(order.litres),
      notes: order.notes || ""
    });
    setStatus({ type: "success", message: "Order details copied. Review and place the order." });
  }

  async function confirmDelivery(orderId) {
    try {
      setStatus({ type: "loading", message: "Confirming delivery..." });
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/orders/${orderId}/confirm-delivery`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveryKey: deliveryKeys[orderId] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not confirm delivery.");
      setOrders((current) => current.map((order) => (order._id === data.order._id ? data.order : order)));
      setStatus({ type: "success", message: "Delivery confirmed. Order completed." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function cancelOrder(orderId) {
    try {
      setStatus({ type: "loading", message: "Cancelling order..." });
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/orders/${orderId}/cancel`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not cancel order.");
      setOrders((current) => current.map((order) => (order._id === data.order._id ? data.order : order)));
      setStatus({ type: "success", message: "Order cancelled." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="dashboard-stack">
      <form className="application-form" onSubmit={submitOrder}>
        <div className="field-grid">
          <TextInput label="Delivery address" name="deliveryAddress" value={form.deliveryAddress} onChange={updateField} wide />
          <label>
            Quantity
            <select name="quantityOption" value={form.quantityOption} onChange={updateField} required>
              <option value="2000">2000L</option>
              <option value="5000">5000L</option>
              <option value="more">More</option>
            </select>
          </label>
          {form.quantityOption === "more" && <TextInput label="Custom litres" name="customLitres" type="number" min="5001" value={form.customLitres} onChange={updateField} />}
          <TextInput label="Notes" name="notes" value={form.notes} onChange={updateField} wide required={false} />
        </div>
        <StatusMessage status={status} />
        <button type="submit" className="submit-button" disabled={status.type === "loading"}><PackagePlus size={18} />Place order</button>
      </form>

      <div className="orders-list">
        <SectionTitle title="Order history" caption="Repeat previous orders or confirm active deliveries." />
        {orders.length === 0 ? <p>No order history yet.</p> : orders.map((order) => (
          <OrderCard key={order._id} order={order}>
            {["assigned", "out_for_delivery"].includes(order.status) && order.deliveryKeyForCustomer && <span className="delivery-key">Delivery key: {order.deliveryKeyForCustomer}</span>}
            {["assigned", "out_for_delivery"].includes(order.status) && (
              <div className="inline-form">
                <input value={deliveryKeys[order._id] || ""} onChange={(event) => setDeliveryKeys((current) => ({ ...current, [order._id]: event.target.value }))} placeholder="Delivery key" />
                <button type="button" className="inline-action" onClick={() => confirmDelivery(order._id)}><CheckCircle2 size={17} />Confirm delivery</button>
              </div>
            )}
            <button type="button" className="inline-action" onClick={() => repeatOrder(order)}><PackagePlus size={17} />Repeat order</button>
            {["pending", "requested"].includes(order.status) && !order.driver && <button type="button" className="secondary-button danger-button" onClick={() => cancelOrder(order._id)}>Cancel order</button>}
          </OrderCard>
        ))}
      </div>
    </div>
  );
}

function DriverOrderBoard({ user }) {
  const [orders, setOrders] = React.useState([]);
  const [isAvailable, setIsAvailable] = React.useState(Boolean(user.isAvailable));
  const [status, setStatus] = React.useState({ type: "idle", message: "" });

  React.useEffect(() => {
    loadDriverOrders();
    const intervalId = window.setInterval(loadDriverOrders, 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function driverFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    const response = await fetch(apiUrl(url), {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Driver request failed.");
    return data;
  }

  async function loadDriverOrders() {
    try {
      const data = await driverFetch("/orders/driver");
      setOrders(data.orders);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function toggleAvailability() {
    try {
      const nextValue = !isAvailable;
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/drivers/availability"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isAvailable: nextValue })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update availability.");
      setIsAvailable(data.driver.isAvailable);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function requestOrder(orderId) {
    try {
      const data = await driverFetch(`/orders/${orderId}/request`, { method: "POST", body: JSON.stringify({}) });
      setOrders((current) => current.map((order) => (order._id === data.order._id ? data.order : order)));
      setStatus({ type: "success", message: "Request sent. Admin will approve the assignment." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function markOutForDelivery(orderId) {
    try {
      const data = await driverFetch(`/orders/${orderId}/driver-status`, { method: "PATCH", body: JSON.stringify({ status: "out_for_delivery" }) });
      setOrders((current) => current.map((order) => (order._id === data.order._id ? data.order : order)));
      setStatus({ type: "success", message: "Order marked out for delivery." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  const activeOrders = orders.filter((order) => order.status !== "completed");
  const completedOrders = orders.filter((order) => order.status === "completed");

  function renderDriverOrder(order) {
    const hasActiveOrder = orders.some((candidate) =>
      ["requested", "assigned", "out_for_delivery"].includes(candidate.status) &&
      (candidate.driver?._id === user.id || candidate.driverRequests?.some((driver) => driver._id === user.id))
    );
    const isAssignedToMe = order.driver?._id === user.id;
    const hasRequested = order.driverRequests?.some((driver) => driver._id === user.id);

    return (
      <OrderCard key={order._id} order={order}>
        {isAssignedToMe && <span>Assigned to you</span>}
        {isAssignedToMe && order.status === "assigned" && <button type="button" className="inline-action" onClick={() => markOutForDelivery(order._id)}><PackagePlus size={17} />Out for delivery</button>}
        {!order.driver && hasRequested && <span>Your request is waiting for admin approval.</span>}
        {!order.driver && !hasRequested && !hasActiveOrder && isAvailable && <button type="button" className="inline-action" onClick={() => requestOrder(order._id)}><PackagePlus size={17} />Request order</button>}
        {!order.driver && !hasRequested && !isAvailable && <span>Set yourself available before requesting orders.</span>}
        {!order.driver && !hasRequested && hasActiveOrder && <span>Finish your active request before choosing another order.</span>}
      </OrderCard>
    );
  }

  return (
    <div className="dashboard-stack">
      <StatusMessage status={status} />
      <div className="toolbar-card">
        <span><strong>Availability</strong><small>{isAvailable ? "You can request orders." : "You are not taking orders."}</small></span>
        <button type="button" className="secondary-button" onClick={toggleAvailability}>{isAvailable ? "Set unavailable" : "Set available"}</button>
      </div>
      <div className="orders-list">
        <SectionTitle title="Driver orders" caption="Request one order, wait for admin approval, then update delivery status." />
        {activeOrders.length === 0 ? <p>No open orders right now.</p> : activeOrders.map(renderDriverOrder)}
      </div>
      <div className="orders-list">
        <SectionTitle title="Completed deliveries" caption="Your finished delivery history." />
        {completedOrders.length === 0 ? <p>No completed deliveries yet.</p> : completedOrders.map(renderDriverOrder)}
      </div>
    </div>
  );
}

function OrderCard({ order, children }) {
  return (
    <article className="order-item">
      <div className="item-head"><strong>{order.deliveryAddress}</strong><StatusBadge status={order.status} /></div>
      <div className="detail-grid">
        {order.customer && <span>Customer: {order.customer.name}</span>}
        {order.customer?.phone && <span>Phone: {order.customer.phone}</span>}
        {order.customer?.email && <span>Email: {order.customer.email}</span>}
        <span>Quantity: {order.litres} litres</span>
        <span>Payment: Cash on delivery</span>
        {order.driver && <span>Driver: {order.driver.name}</span>}
      </div>
      <OrderTimeline history={order.statusHistory} />
      {children}
    </article>
  );
}

function TextInput({ label, wide, required = true, ...props }) {
  return (
    <label className={wide ? "wide" : ""}>
      {label}
      <input {...props} required={required} />
    </label>
  );
}

function StatusMessage({ status }) {
  if (!status.message) return null;
  return (
    <div className={`status ${status.type}`}>
      {status.type === "loading" && <Loader2 size={18} className="spin" />}
      {status.type === "success" && <CheckCircle2 size={18} />}
      {status.type === "error" && <XCircle size={18} />}
      <span>{status.message}</span>
    </div>
  );
}

function SectionTitle({ title, caption }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{caption}</p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OrderTimeline({ history = [] }) {
  if (!history.length) return null;
  return (
    <div className="timeline">
      {history.map((item, index) => (
        <div className="timeline-item" key={`${item.status}-${item.changedAt}-${index}`}>
          <span />
          <p>
            <strong>{item.status.replaceAll("_", " ")}</strong>
            <small>{item.message || item.changedByRole}</small>
          </p>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const label = status.replaceAll("_", " ");
  return <span className={`status-badge ${status.replaceAll("_", "-").replaceAll(" ", "-")}`}>{label}</span>;
}

function DocumentUpload({ id, title, file, preview, onChange }) {
  return (
    <label className="upload-box" htmlFor={id}>
      <input id={id} type="file" accept="image/jpeg,image/jpg,image/png" onChange={(event) => onChange(event.target.files?.[0])} />
      {preview ? <img src={preview} alt={`${title} preview`} /> : <span className="empty-preview"><FileImage size={36} /></span>}
      <span className="upload-copy">
        <strong>{title}</strong>
        <small>{file ? file.name : "JPG, JPEG, or PNG"}</small>
      </span>
    </label>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
