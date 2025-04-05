import { Router } from "express";
import platformAPIClient from "../services/platformAPIClient";

export default function mountUserEndpoints(router: Router) {
  // User sign-in
  router.post('/signin', async (req, res) => {
    const auth = req.body.authResult;
    const userCollection = req.app.locals.userCollection;

    try {
      // Verify the user's access token
      const me = await platformAPIClient.get(`/v2/me`, { headers: { 'Authorization': `Bearer ${auth.accessToken}` } });

      console.log(me);
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: "Invalid access token" });
    }

    let currentUser = await userCollection.findOne({ uid: auth.user.uid });

    if (currentUser) {
      await userCollection.updateOne(
        { _id: currentUser._id },
        { $set: { accessToken: auth.accessToken } }
      );
    } else {
      const insertResult = await userCollection.insertOne({
        username: auth.user.username,
        uid: auth.user.uid,
        roles: auth.user.roles,
        accessToken: auth.accessToken
      });

      currentUser = await userCollection.findOne(insertResult.insertedId);
    }

    req.session.currentUser = currentUser;

    return res.status(200).json({
      message: "User signed in",
      user: {
        username: currentUser.username,
        uid: currentUser.uid,
      },
    });
  });

  // User sign-out
  router.get('/signout', async (req, res) => {
    req.session.currentUser = null;
    return res.status(200).json({ success: true, message: "User signed out" });
  });

  // Check login status
  router.get('/check-login', async (req, res) => {
    if (req.session.currentUser) {
      return res.status(200).json({
        loggedIn: true,
        user: {
          username: req.session.currentUser.username,
          uid: req.session.currentUser.uid,
        },
      });
    } else {
      return res.status(200).json({ loggedIn: false });
    }
  });
}
