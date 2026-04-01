import { Router, type IRouter } from "express";
import { db, rolesTable, permissionsTable, rolePermissionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/roles", async (req, res) => {
  try {
    const roles = await db.select().from(rolesTable).orderBy(rolesTable.id);
    res.json(roles.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to get roles");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/roles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const [role] = await db.select().from(rolesTable).where(eq(rolesTable.id, id));
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json({ ...role, createdAt: role.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get role" );
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/roles/:id/permissions", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const rows = await db
      .select({
        id: permissionsTable.id,
        resource: permissionsTable.resource,
        action: permissionsTable.action,
        description: permissionsTable.description,
        createdAt: permissionsTable.createdAt,
      })
      .from(rolePermissionsTable)
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(eq(rolePermissionsTable.roleId, id));
    res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to get role permissions");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/permissions", async (req, res) => {
  try {
    const perms = await db.select().from(permissionsTable).orderBy(permissionsTable.resource, permissionsTable.action);
    res.json(perms.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to get permissions");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/roles/:id/permissions/:permissionId", async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const permissionId = parseInt(req.params.permissionId);
    if (isNaN(roleId) || isNaN(permissionId)) return res.status(400).json({ message: "Invalid ID" });

    const [role] = await db.select().from(rolesTable).where(eq(rolesTable.id, roleId));
    if (!role) return res.status(404).json({ message: "Role not found" });

    const [perm] = await db.select().from(permissionsTable).where(eq(permissionsTable.id, permissionId));
    if (!perm) return res.status(404).json({ message: "Permission not found" });

    const [inserted] = await db
      .insert(rolePermissionsTable)
      .values({ roleId, permissionId })
      .onConflictDoNothing()
      .returning();
    res.status(201).json(inserted ? { ...inserted, createdAt: inserted.createdAt.toISOString() } : { message: "Already assigned" });
  } catch (err) {
    req.log.error({ err }, "Failed to assign permission to role");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/roles/:id/permissions/:permissionId", async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const permissionId = parseInt(req.params.permissionId);
    if (isNaN(roleId) || isNaN(permissionId)) return res.status(400).json({ message: "Invalid ID" });

    await db
      .delete(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleId, roleId));
    res.json({ message: "Permission removed from role" });
  } catch (err) {
    req.log.error({ err }, "Failed to remove permission from role");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
