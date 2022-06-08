export const apiHandlers = {
  // examplevideo: import("./_example/api"),
  applecalendar: import("./applecalendar/api"),
  caldavcalendar: import("./caldavcalendar/api"),
  googlecalendar: import("./googlecalendar/api"),
  hubspotothercalendar: import("./hubspotothercalendar/api"),
  office365calendar: import("./office365calendar/api"),
  slackmessaging: import("./slackmessaging/api"),
  stripepayment: import("./stripepayment/api"),
  tandemvideo: import("./tandemvideo/api"),
  vital: import("./vital/api"),
  zoomvideo: import("@calcom/zoomvideo/api"),
  office365video: import("@calcom/office365video/api"),
  wipemycalother: import("./wipemycalother/api"),
  jitsivideo: import("./jitsivideo/api"),
  huddle01video: import("./huddle01video/api"),
  metamask: import("./metamask/api"),
  giphy: import("./giphy/api"),
  spacebookingother: import("./spacebooking/api"),
  // @todo Until we use DB slugs everywhere
  zapierother: import("./zapier/api"),
  mercadopago: import("./mercadopago/api")
};

export default apiHandlers;
