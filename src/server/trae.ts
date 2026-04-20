import { Hono } from "hono";
import { TraeManager } from "../trae-manager/index";
import { bindLogRoutes } from "./utils";

const traeManager = new TraeManager();

const traeApi = new Hono()
  .post("/apply-email", async (c) => {
    try {
      const result = await traeManager.applyTempEmail();
      return c.json(result);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  })
  .get("/history", async (c) => {
    try {
      const history = await traeManager.getHistory();
      return c.json({ success: true, data: history });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  })
  .delete("/history/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const result = await traeManager.deleteHistory(id);
      return c.json(result);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

bindLogRoutes(traeApi, traeManager.logger);

export default traeApi;
