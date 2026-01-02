import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { sql } from 'slonik';
import logger from '../config/logger.js';
import connectDatabase from '../config/db.js';
    var opts = {}
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = process.env.JWT_SECRET || 'secret';

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const pool = await connectDatabase();
        const users = await pool.any(sql.unsafe`SELECT * FROM users WHERE id = ${jwt_payload.sub}`);
            if (users.length > 0) {
                // Remove password from user object before returning
                const { password: _, ...userWithoutPassword } = users[0];
                return done(null, userWithoutPassword);
            } else {
                return done(null, null);
            }
        } catch (err) {
            logger.error("Error in Jwt Strategy",err);
            return done(err, false);
        }
}));