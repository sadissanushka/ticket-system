# 🛡️ Admin Management Guide (Go Edition)

This guide explains how to manage staff accounts using the native **Go-based Admin CLI**, built with official **Charmbracelet** libraries.

---

## 🚀 Getting Started

The native CLI provides a high-performance, interactive experience using **Bubble Tea** and **Lip Gloss**. To start, navigate to the `backend/` directory and run:

```bash
npm run admin
```

*(Note: Requires Go 1.18+ to be installed on the server/machine)*

### 📋 Main Menu Navigation

Once started, you can navigate using your **arrow keys** and special shortcuts:

1.  **View Staff**: The default view shows a table of all technicians and admins.
2.  **Add New Staff/Admin**: Press `n` on your keyboard to open the creation form. You can choose either `TECHNICIAN` or `ADMIN` roles.
3.  **Keyboard Shortcuts**:
    *   `n`: Create a new staff member.
    *   `q` / `ctrl+c`: Exit the application.
    *   `esc`: Cancel current form and return to list.
    *   `↑ / ↓`: Scroll through the staff table.

---

## 🛠️ Performance & Security

- **Native Speed**: Unlike the previous version, this tool runs directly as a binary, making it extremely fast even on low-resource EC2 instances.
- **Secure Hashing**: Password hashing is handled using native Go `bcrypt` modules, perfectly compatible with the main Node.js application.
- **Direct Database Access**: Communicates directly with your PostgreSQL database using the `pgx` driver.

---

## ⚠️ Troubleshooting

1.  **Go Not Found**: If `npm run admin` fails with a "go: not found" error, ensure Go is in your system PATH or restart your terminal session.
2.  **Database Connection**: The tool uses the `DATABASE_URL` from your `.env` file. Ensure this is correctly set up.
3.  **SSH Terminal**: Works perfectly over SSH. If the interface looks garbled, ensure your terminal supports ANSI colors.
