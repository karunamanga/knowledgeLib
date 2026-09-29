# Role-Based Access Control (RBAC) Specification

The platform utilizes **Database-Driven Permissions** coupled with **FastAPI Dependency Injection**.

## 1. System Roles

| Role | Target Persona | Key Responsibilities |
| :--- | :--- | :--- |
| **ADMIN** | Engineering Leadership / Portal Admins | Full unrestricted system access, user provisioning, role assignments, global taxonomy management, security audit log inspection. |
| **MENTOR** | Tech Leads / Senior Architects | Reviewing employee submissions, approving deliverables, providing code review feedback, publishing learning path curricula. |
| **EMPLOYEE** | Engineers / Interns / Freshers | Exploring knowledge library, logging daily learning entries, completing learning roadmaps, submitting capstones for review. |

---

## 2. Granular Permission Matrix

| Permission Code | Description | EMPLOYEE | MENTOR | ADMIN |
| :--- | :--- | :---: | :---: | :---: |
| `knowledge:read` | View & search resources | ✅ | ✅ | ✅ |
| `knowledge:create` | Upload knowledge resources | ✅ | ✅ | ✅ |
| `knowledge:update` | Edit knowledge resources | Own only | Own only | ✅ All |
| `knowledge:delete` | Delete knowledge resources | Own only | Own only | ✅ All |
| `learning:read` | Read journal entries | ✅ | ✅ | ✅ |
| `learning:create` | Record daily learning entries | ✅ | ✅ | ✅ |
| `learning:update` | Modify journal entries | Own only | Own only | ✅ All |
| `path:read` | View learning paths & roadmaps | ✅ | ✅ | ✅ |
| `path:manage` | Create/edit learning path roadmaps | ❌ | ✅ | ✅ |
| `submission:create` | Submit work for review | ✅ | ✅ | ✅ |
| `submission:read` | Read submission feedback | ✅ | ✅ | ✅ |
| `submission:review`| Approve/reject employee submissions | ❌ | ✅ | ✅ |
| `project:read` | Explore company project repository | ✅ | ✅ | ✅ |
| `project:manage` | Create/edit company project entries | ❌ | ✅ | ✅ |
| `user:read` | View directory & user profiles | ✅ | ✅ | ✅ |
| `user:manage` | Provision users & assign roles | ❌ | ❌ | ✅ |
| `category:manage` | Create & update categories | ❌ | ❌ | ✅ |
| `audit:read` | Inspect security audit trail | ❌ | ❌ | ✅ |
