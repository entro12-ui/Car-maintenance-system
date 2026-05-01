# Car Service Management System — Customer & user help

## Signing in and roles

Customers sign in with the email used at registration. After login, customers are taken to the customer dashboard. Staff (Admin) and accountants use separate credentials and see different menus. If you cannot log in, confirm your email and password, or use registration or password recovery flows your organization provides.

**In-app:** `/login`, `/register`

## Customer dashboard overview

The customer dashboard summarizes your relationship with the garage: vehicles, upcoming or past services, and appointments when exposed by your shop. Use the sidebar links to open **My Vehicles**, **My Services**, and **Appointments**.

**In-app:** `/customer/dashboard`

## My vehicles

Add or view vehicles tied to your account. Typical fields include license plate, make, model, year, mileage, and fuel type. Keeping mileage updated helps the shop recommend service intervals. If a plate is already registered, contact the garage; it may be on another account.

**In-app:** `/customer/vehicles`

## My services

View service history and details the garage recorded for your vehicles: work performed, parts, labor, and dates. Specific line items depend on what your shop enters in the system.

**In-app:** `/customer/services`

## Appointments (customer)

Book or review service appointments when your garage enables this workflow. Choose a suitable time and vehicle; confirm any instructions from the shop (e.g. drop-off, courtesy vehicle). To change or cancel, follow the shop’s policy—often by phone or through staff.

**In-app:** `/customer/appointments`

## Loyalty program

Many deployments use a loyalty rule such as “pay for three qualifying services, get a fourth free” (wording may differ). Eligibility, qualifying services, and redemption are configured by the garage. Ask staff how your balance is tracked and how to apply a free service.

**In-app:** `/loyalty` (staff); benefits may appear in customer views depending on setup

## Invoices, estimates, and job work (general)

Garages using full workshop features track **job orders**, **estimates**, **proformas**, and **invoices**. As a customer you usually receive printed or PDF documents from the shop; the software’s internal screens are for staff. Questions about totals, tax, or payment terms should go to the garage office.

## Notifications and reminders

The system can support service reminders and notifications. Delivery method (email, SMS, in-app) depends on configuration. If you are not receiving reminders, verify your contact details with the shop.

## Privacy and account data

Your vehicle and service data are stored for operational purposes by the garage. For export, correction, or deletion requests, contact the data controller (your service provider or garage) under their privacy policy.

## Getting human help

This assistant answers from product documentation and suggested videos. It does **not** have access to your live account, invoices, or real-time shop availability. For booking changes, billing disputes, or urgent vehicle issues, contact your garage directly.

## Optional: general maintenance education (third-party)

These links are for general education; your vehicle’s manual and your technician’s advice take priority.

- [How often should you service your car?](https://www.youtube.com/watch?v=0T1tvq5ZCjM)
- [Car maintenance checklist basics](https://www.youtube.com/watch?v=nKgPu_6ClAI)

## Maintenance hub — staff setup menus

The **Maintenance** navigator groups workshop setup: parameters, job orders, customers/vehicles, charge catalogs, sublets, and control screens. Open **`/maintenance-hub`** for the hub, then choose a tile.

Typical routes (paths shown as **In-app**):

**Parameters**

- Global Parameters — **`/global-parameters`**
- Name Value Parameter — **`/name-value-parameter`**

**Job order**

- Job Order list/detail — **`/job-orders`**
- Open job from appointment — **`/work-order-creation`**

**Customer and vehicle**

- Customer maintenance — **`/customers`**
- Plate number (fleet plates / billing flags) — **`/plate-number-maintenance`**
- Canceled jobs registry — **`/canceled-jobs-registry`**

**Charges and sublet**

- Labour types — **`/job-orders/labor-types`**
- Other charge setup — **`/job-orders/additional-charges/other-charge-setup`**
- Lubricants and fuel — **`/job-orders/additional-charges/lubricants-and-fuel`**
- Miscellaneous charges — **`/job-orders/additional-charges/miscellaneous-charges`**
- Sublet work type — **`/job-orders/additional-charges/sublet-work-type`**
- Consumable charge setup — **`/consumable-charge-setup`**
- Sublet supplier maintenance — **`/sublet-supplier-maintenance`**

**Control**

- Block / release job order — **`/block-release-job-order`**
- Register sold vehicle — **`/vehicles`** (vehicle registration workflow)

**Vehicle and job type**

- Vehicle model setup — **`/vehicle-model-setup`**
- Job type per hour rate — **`/job-type-hourly-rate`**

Use these paths when explaining where to configure labor rates, extra charges, or fleet plates.

## Reports hub — staff navigation

Staff open **`/reports-hub`** for the Reports navigator. Standard tiles redirect into **Garage reports**:

- Listing reports — **`/garage-reports-hub/listing`**
- Sales reports — **`/garage-reports-hub/sales`**
- Productivity reports — **`/garage-reports-hub/productivity`**
- Other reports — **`/garage-reports-hub/others`**

The hub shortcut **`/garage-reports-hub`** opens the garage reports dashboard.

**Custom reporting**

- Custom report — **`/reports-hub/custom-report`** (runs Custom Reports tooling where configured)
- User defined report — **`/reports-hub/user-defined-report`**
- Edit user defined report — **`/reports-hub/edit-user-defined-report`**

**Tips for running reports**

- Choose a **date range** first (period/month/quarter) when the screen offers filters.
- **Listing** reports usually answer “what happened” (jobs, stock moves, transactions).
- **Sales** reports focus on revenue, discounts, and invoice-level summaries.
- **Productivity** ties to labor hours, throughput, or technician-oriented metrics (wording depends on deployment).
- Export or print from the report run screen when your browser allows; exact buttons vary by report page.

The AI assistant cannot execute reports or read live totals — only explain menus and typical interpretation.
