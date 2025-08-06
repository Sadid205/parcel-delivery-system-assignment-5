import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";
import bcryptjs from "bcryptjs";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        const isUserExist = await User.findOne({ email });
        if (!isUserExist) {
          return done("User Does Not Exist");
        }
        if (!isUserExist.isVerified) {
          return done("User Is Not Verified");
        }
        if (
          isUserExist.isActive === IsActive.BLOCKED ||
          isUserExist.isActive === IsActive.INACTIVE
        ) {
          return done(null, false, {
            message: `User Is ${isUserExist.isActive}`,
          });
        }
        if (isUserExist && isUserExist.isDeleted) {
          return done(null, false, { message: "User Is Deleted" });
        }
        const isPasswordMatched = await bcryptjs.compare(
          password as string,
          isUserExist.password as string
        );
        if (!isPasswordMatched) {
          return done("Password Does Not Match");
        }
        return done(null, isUserExist);
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.log(error);
    done(error);
  }
});
