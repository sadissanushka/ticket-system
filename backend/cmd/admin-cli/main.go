package main

import (
	"context"
	"fmt"
	"os"

	"github.com/charmbracelet/bubbles/table"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

var (
	baseStyle = lipgloss.NewStyle().
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("240"))

	titleStyle = lipgloss.NewStyle().
			MarginLeft(2).
			MarginTop(1).
			Padding(0, 1).
			Background(lipgloss.Color("62")).
			Foreground(lipgloss.Color("230")).
			Bold(true)

	statusStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("241")).
			MarginLeft(2)

	helpStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("241")).
			MarginLeft(2)

	errorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("196")).
			Bold(true).
			MarginLeft(2)

	successStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("42")).
			Bold(true).
			MarginLeft(2)
)

type User struct {
	ID        string
	Name      string
	Email     string
	Role      string
	StudentID string
}

type model struct {
	table      table.Model
	inputs     []textinput.Model
	focusIndex int
	view       string // "list", "add", "msg"
	users      []User
	db         *pgx.Conn
	err        error
	status     string
	success    string
}

type usersMsg []User
type errorMsg error
type successMsg string

func fetchUsers(db *pgx.Conn) tea.Cmd {
	return func() tea.Msg {
		rows, err := db.Query(context.Background(), "SELECT id, name, email, role, \"studentId\" FROM \"User\" WHERE role IN ('ADMIN', 'TECHNICIAN')")
		if err != nil {
			return errorMsg(err)
		}
		defer rows.Close()

		var users []User
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.StudentID); err != nil {
				return errorMsg(err)
			}
			users = append(users, u)
		}
		return usersMsg(users)
	}
}

func createUser(db *pgx.Conn, name, email, studentID, password, role string) tea.Cmd {
	return func() tea.Msg {
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), 10)
		if err != nil {
			return errorMsg(err)
		}

		_, err = db.Exec(context.Background(),
			"INSERT INTO \"User\" (id, name, email, \"studentId\", password, role, \"updatedAt\") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())",
			name, email, studentID, string(hashed), role)
		if err != nil {
			return errorMsg(err)
		}
		return successMsg(fmt.Sprintf("User %s created!", name))
	}
}

func (m model) Init() tea.Cmd {
	return fetchUsers(m.db)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			if m.view == "list" {
				return m, tea.Quit
			}
		case "esc":
			if m.view == "add" {
				m.view = "list"
				m.success = ""
				m.err = nil
				return m, nil
			}
		case "n":
			if m.view == "list" {
				m.view = "add"
				m.focusIndex = 0
				m.inputs[0].Focus()
				return m, nil
			}
		case "enter":
			if m.view == "add" {
				if m.focusIndex == len(m.inputs)-1 {
					// Submit
					return m, createUser(m.db,
						m.inputs[0].Value(),
						m.inputs[1].Value(),
						m.inputs[2].Value(),
						m.inputs[3].Value(),
						m.inputs[4].Value())
				}
				m.focusIndex++
				for i := range m.inputs {
					if i == m.focusIndex {
						m.inputs[i].Focus()
					} else {
						m.inputs[i].Blur()
					}
				}
				return m, nil
			}
		case "tab", "shift+tab":
			if m.view == "add" {
				s := msg.String()
				if s == "shift+tab" {
					m.focusIndex--
				} else {
					m.focusIndex++
				}

				if m.focusIndex > len(m.inputs)-1 {
					m.focusIndex = 0
				} else if m.focusIndex < 0 {
					m.focusIndex = len(m.inputs) - 1
				}

				for i := range m.inputs {
					if i == m.focusIndex {
						m.inputs[i].Focus()
					} else {
						m.inputs[i].Blur()
					}
				}
				return m, nil
			}
		}
	case usersMsg:
		m.users = msg
		m.view = "list"
		rows := []table.Row{}
		for _, u := range m.users {
			rows = append(rows, table.Row{u.Name, u.Email, u.Role, u.StudentID})
		}
		m.table.SetRows(rows)
	case successMsg:
		m.success = string(msg)
		m.view = "list"
		return m, fetchUsers(m.db)
	case errorMsg:
		m.err = msg
	}

	if m.view == "list" {
		m.table, cmd = m.table.Update(msg)
	} else if m.view == "add" {
		cmd = m.updateInputs(msg)
	}

	return m, cmd
}

func (m *model) updateInputs(msg tea.Msg) tea.Cmd {
	cmds := make([]tea.Cmd, len(m.inputs))
	for i := range m.inputs {
		m.inputs[i], cmds[i] = m.inputs[i].Update(msg)
	}
	return tea.Batch(cmds...)
}

func (m model) View() string {
	s := "\n" + titleStyle.Render(" UNITEC ASSIST ADMIN CLI ") + "\n\n"

	if m.view == "list" {
		s += baseStyle.Render(m.table.View()) + "\n\n"
		if m.success != "" {
			s += successStyle.Render(m.success) + "\n"
		}
		if m.err != nil {
			s += errorStyle.Render(fmt.Sprintf("Error: %v", m.err)) + "\n"
		}
		s += helpStyle.Render("n: new tech • q: quit • ↑/↓: navigate")
	} else if m.view == "add" {
		s += "  " + pc.Bold("Create New Technician") + "\n\n"
		for i := range m.inputs {
			s += fmt.Sprintf("  %s\n", m.inputs[i].View())
		}
		s += "\n  " + helpStyle.Render("enter: next/submit • esc: back • tab: navigate")
	}

	return s + "\n"
}

// Dummy helper for pc.Bold (we keep script concise)
var pc = struct {
	Bold func(string) string
}{
	Bold: func(s string) string { return lipgloss.NewStyle().Bold(true).Render(s) },
}

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		fmt.Printf("Error loading .env file: %v\n", err)
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("DATABASE_URL is not set in .env")
		os.Exit(1)
	}

	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		fmt.Printf("Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	// Table setup
	columns := []table.Column{
		{Title: "Name", Width: 20},
		{Title: "Email", Width: 25},
		{Title: "Role", Width: 12},
		{Title: "ID", Width: 10},
	}
	t := table.New(
		table.WithColumns(columns),
		table.WithFocused(true),
		table.WithHeight(10),
	)
	ts := table.DefaultStyles()
	ts.Header = ts.Header.BorderStyle(lipgloss.NormalBorder()).BorderForeground(lipgloss.Color("240")).BorderBottom(true).Bold(false)
	ts.Selected = ts.Selected.Foreground(lipgloss.Color("229")).Background(lipgloss.Color("57")).Bold(false)
	t.SetStyles(ts)

	// Inputs setup
	inputs := make([]textinput.Model, 5)
	var t1 textinput.Model
	for i := range inputs {
		t1 = textinput.New()
		switch i {
		case 0:
			t1.Placeholder = "Full Name"
		case 1:
			t1.Placeholder = "Email Address"
		case 2:
			t1.Placeholder = "Student/Staff ID"
		case 3:
			t1.Placeholder = "Password"
			t1.EchoMode = textinput.EchoPassword
			t1.EchoCharacter = '•'
		case 4:
			t1.Placeholder = "Role (TECHNICIAN/ADMIN)"
			t1.SetValue("TECHNICIAN")
		}
		inputs[i] = t1
	}

	m := model{
		db:     conn,
		table:  t,
		inputs: inputs,
		view:   "list",
	}

	if _, err := tea.NewProgram(m, tea.WithAltScreen()).Run(); err != nil {
		fmt.Printf("Alas, there's been an error: %v", err)
		os.Exit(1)
	}
}
