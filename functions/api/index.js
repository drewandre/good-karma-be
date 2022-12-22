/* eslint-disable operator-linebreak */
/* eslint-disable require-jsdoc */

("use strict");

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const contentful = require("contentful");

const app = express();

app.use(cors({ origin: true }));

const contentfulClient = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "z08x63qrkj2y",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "LZCL1WbvDarZQA9wRhPv0tkwc8vkuVVyRpbqpy-D8T0",
});

app.post("/contentful", async (req, res) => {
  try {
    const topic = req.headers["x-contentful-topic"];
    const [ContentManagement, topicType, topicAction] = topic.split(".");

    let entryId;

    let imageUrl = undefined;
    let snapshot = undefined;
    let shouldHandleResponse = true;

    switch (topicType) {
      case "BulkAction":
        break;
      case "Entry":
        entryId = req.body.sys.id;
        switch (topicAction) {
          case "create":
            console.log("Content was created");
            break;
          case "archive":
            console.log("Content was archived");
            break;
          case "delete":
            console.log("Content was deleted");
            break;
          case "unarchive":
            console.log("Content was unarchived");
            break;
          case "publish":
            try {
              snapshot = await admin
                .firestore()
                .collection("publishedContentId")
                .where("uid", "==", entryId)
                .get();
              if (snapshot.empty) {
                snapshot = await admin
                  .firestore()
                  .collection("publishedContentId")
                  .add({
                    uid: entryId,
                  });
                shouldHandleResponse = false;
                console.log("Content was published");
                try {
                  imageUrl = await contentfulClient.getAsset(
                    req.body.fields.coverPhoto["en-US"].sys.id
                  );
                  functions.logger.log("imageUrl1");
                  functions.logger.log(imageUrl);

                  if (imageUrl?.fields?.file?.url) {
                    functions.logger.log("imageUrl2");
                    functions.logger.log(imageUrl?.fields?.file?.url);
                    imageUrl = `https:${imageUrl.fields.file.url}`;
                  } else {
                    functions.logger.error(
                      new Error("Retrieved asset, but was malformed")
                    );
                  }
                } catch (error) {
                  functions.logger.error(error);
                }
                functions.logger.log("imageUrl3");
                functions.logger.log(imageUrl);
                admin
                  .messaging()
                  .send({
                    notification: {
                      title: req.body.fields.pushTitle["en-US"],
                      body: req.body.fields.pushBody["en-US"],
                      imageUrl,
                    },
                    android: {
                      notification: {
                        imageUrl,
                      },
                    },
                    apns: {
                      payload: {
                        aps: {
                          "mutable-content": 1,
                        },
                      },
                      fcm_options: {
                        image: imageUrl,
                      },
                    },
                    webpush: {
                      headers: {
                        image: imageUrl,
                      },
                    },
                    data: {
                      id: entryId,
                      type: "article",
                    },
                    topic: "newArticles",
                  })
                  .then(() => {
                    res.sendStatus(200);
                  })
                  .catch((error) => {
                    res.sendStatus(500);
                    functions.logger.error(error);
                  });
              } else {
                functions.logger.warn(
                  "Already sent a push for this content! Skipping..."
                );
              }
            } catch (error) {
              res.sendStatus(500);
              functions.logger.error(error);
            }
            break;
          case "unpublish":
            console.log("Content was unpublished");
            break;
          case "save":
          case "auto_save":
            console.log("Content was saved or auto-saved");
            break;
          default:
            console.log(`${entryId} unknown action:`, topicAction);
            break;
        }
        break;
      default:
        console.log("Unknown type", topicType);
    }
    if (shouldHandleResponse) {
      res.sendStatus(200);
    }
  } catch (error) {
    console.warn("Unable to handle contentful webhook", error);
    res.sendStatus(500);
  }
});

// Expose the API as a function
exports.api = functions.https.onRequest(app);
