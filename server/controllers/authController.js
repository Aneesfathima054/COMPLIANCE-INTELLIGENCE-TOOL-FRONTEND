const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { inMemoryStore, createId, sanitizeUser } = require("../utils/inMemoryStore");

const isDbConnected = () => mongoose.connection.readyState === 1;
const getAdminEmails = () =>
	(process.env.ADMIN_EMAILS || "")
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);

const resolveRoleFromEmail = (email) => {
	const adminEmails = getAdminEmails();
	return adminEmails.includes((email || "").toLowerCase()) ? "ADMIN" : "USER";
};

const isUniversalLoginEnabled = () =>
	String(process.env.ALLOW_ANY_LOGIN || "").trim().toLowerCase() === "true";

const resolveEffectiveRole = (requestedRole, email) => {
	if (requestedRole && ["USER", "ADMIN"].includes(requestedRole)) {
		return requestedRole;
	}

	return resolveRoleFromEmail(email);
};

const promoteAdminRoleIfNeeded = async (user, email) => {
	const shouldBeAdmin = resolveRoleFromEmail(email) === "ADMIN";

	if (!shouldBeAdmin || user.role === "ADMIN") {
		return;
	}

	user.role = "ADMIN";

	if (typeof user.save === "function") {
		await user.save();
	}
};

exports.register = async(req,res)=>{

try{

const {name,email,password}=req.body;
const normalizedEmail = (email || "").trim().toLowerCase();
const role = resolveRoleFromEmail(normalizedEmail);

if(!name || !email || !password)
return res.status(400).json({message:"Name, email and password are required"});

if(isDbConnected()){

const userExists = await User.findOne({email: normalizedEmail});

if(userExists)
return res.status(400).json({message:"User already exists"});

const hashedPassword = await bcrypt.hash(password,10);

const user = await User.create({
name,
email:normalizedEmail,
password:hashedPassword,
role
});

const safeUser = user.toObject();
delete safeUser.password;

return res.json(safeUser);

}

const existingUser = inMemoryStore.users.find(
	(item) => item.email.toLowerCase() === normalizedEmail
);

if(existingUser)
return res.status(400).json({message:"User already exists"});

const hashedPassword = await bcrypt.hash(password,10);

const user = {
	_id: createId(),
	name,
	email: normalizedEmail,
	password: hashedPassword,
	role,
	createdAt: new Date()
};

inMemoryStore.users.push(user);

return res.json(sanitizeUser(user));

}catch(error){
res.status(500).json({message:error.message || "Registration failed"});
}

};

exports.login = async(req,res)=>{

try{

const {email,password,role}=req.body;
const normalizedEmail = (email || "").trim().toLowerCase();
const requestedRole = typeof role === "string" ? role.trim().toUpperCase() : "";
const effectiveRole = resolveEffectiveRole(requestedRole, normalizedEmail);

if(!email || !password)
return res.status(400).json({message:"Email and password are required"});

if(requestedRole && !["USER", "ADMIN"].includes(requestedRole))
return res.status(400).json({message:"Invalid role selection"});

if (isUniversalLoginEnabled()) {

	if (isDbConnected()) {
		let user = await User.findOne({ email: normalizedEmail });

		if (!user) {
			const hashedPassword = await bcrypt.hash(password, 10);
			user = await User.create({
				name: normalizedEmail.split("@")[0] || "Demo User",
				email: normalizedEmail,
				password: hashedPassword,
				role: effectiveRole
			});
		} else if (user.role !== effectiveRole) {
			user.role = effectiveRole;
			await user.save();
		}

		const token = jwt.sign(
			{id:user._id,role:effectiveRole},
			process.env.JWT_SECRET,
			{expiresIn:"1d"}
		);

		const safeUser = user.toObject();
		delete safeUser.password;
		safeUser.role = effectiveRole;

		return res.json({token,user:safeUser});
	}

	let user = inMemoryStore.users.find(
		(item) => item.email.toLowerCase() === normalizedEmail
	);

	if (!user) {
		const hashedPassword = await bcrypt.hash(password, 10);
		user = {
			_id: createId(),
			name: normalizedEmail.split("@")[0] || "Demo User",
			email: normalizedEmail,
			password: hashedPassword,
			role: effectiveRole,
			createdAt: new Date()
		};

		inMemoryStore.users.push(user);
	} else {
		user.role = effectiveRole;
	}

	const token = jwt.sign(
		{id:user._id,role:effectiveRole},
		process.env.JWT_SECRET,
		{expiresIn:"1d"}
	);

	return res.json({token,user:sanitizeUser(user)});
}

if(isDbConnected()){

const user = await User.findOne({email: normalizedEmail});

if(!user)
return res.status(401).json({message:"Invalid credentials"});

const isMatch = await bcrypt.compare(password,user.password);

if(!isMatch)
return res.status(400).json({message:"Invalid credentials"});

await promoteAdminRoleIfNeeded(user, normalizedEmail);

if(requestedRole && user.role !== requestedRole)
return res.status(403).json({message:`This account is ${user.role}. Please select ${user.role} to continue.`});

const token = jwt.sign(
{id:user._id,role:user.role},
process.env.JWT_SECRET,
{expiresIn:"1d"}
);

const safeUser = user.toObject();
delete safeUser.password;

return res.json({token,user:safeUser});

}

const user = inMemoryStore.users.find(
	(item) => item.email.toLowerCase() === normalizedEmail
);

if(!user)
return res.status(401).json({message:"Invalid credentials"});

const isMatch = await bcrypt.compare(password,user.password);

if(!isMatch)
return res.status(400).json({message:"Invalid credentials"});

await promoteAdminRoleIfNeeded(user, normalizedEmail);

if(requestedRole && user.role !== requestedRole)
return res.status(403).json({message:`This account is ${user.role}. Please select ${user.role} to continue.`});

const token = jwt.sign(
{id:user._id,role:user.role},
process.env.JWT_SECRET,
{expiresIn:"1d"}
);

return res.json({token,user:sanitizeUser(user)});

}catch(error){
res.status(500).json({message:error.message || "Login failed"});
}

};