/////////////////////////////////////////////
// Importar Dependencias
/////////////////////////////////////////////
require("dotenv").config(); 
const express = require("express"); 
const path = require('path');
const morgan = require("morgan"); 
const methodOverride = require("method-override");
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const Usuario = require("./models/usuario");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


// Crear conexión a base de datos MongoDB
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Conexión establecida a MongoDB!"
    );
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

const DATABASE_URL = process.env.DATABASE_URL;
const CONFIG = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(DATABASE_URL, CONFIG);

mongoose.connection
  .on("open", () => console.log("Connected to Mongoose"))
  .on("close", () => console.log("Disconnected from Mongoose"))
  .on("error", (error) => console.log(error));
////////////////////////////////////////////////
// Our Models
////////////////////////////////////////////////
// pull schema and model from mongoose
const { Schema, model } = mongoose;

// make fruits schema
const todoSchema = new Schema({
  text: String,
});

// make fruit model
const Todo = model("Todo", todoSchema);

// pets schema
const petSchema = new Schema({
  nombre: String,
  sexo: String,
  especie: String,
  raza: String,
  edad: Number,
  esterilizado: Boolean,
  vacunas: Boolean,
  ubicacion: String,
  cuidadosEspeciales: String,
  imagenes: [
    {
      type: String,
    },
  ],
});
const Pet = model("Pet", petSchema);

// Schema de solicitud
const solicitudSchema = new Schema({
  mascotaId: ObjectId,
  nombreMascota: String,
  nombreResponsable: String,
  edad: Number,
  ciudad: String,
  localidad: String,
  barrio: String,
  telefono: Number,
  correo: String,
  familia: Number,
  edadesFamilia: Number,
  intencion: Boolean,
  acuerdo: Boolean,
  porque: String,
  alergia: Boolean,
  mascotaAnterior: Boolean,
  porqueYaNoEstan: String,
  mascotaActual: Boolean,
  cuales: String,
  esterilizar: Boolean,
  seguimiento: Boolean,
});
const Solicitud = model("Solicitud", solicitudSchema);

// usuario schema
const usuarioSchema = new Schema({
  nombre: String,
  email: { type: String, unique: true },
  contraseña: String,
  role: String,
});

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

/////////////////////////////////////////////////
// Create our Express Application Object
/////////////////////////////////////////////////
const app = express();
/////////////////////////////////////////////////////
// Middleware
/////////////////////////////////////////////////////
app.use(morgan("tiny")); //logging
app.use(methodOverride("_method")); // override for put and delete requests from forms
app.use(express.urlencoded({ extended: true })); // parse urlencoded request bodies
app.use("/static", express.static("static")); // serve files from public statically
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

////////////////////////////////////////////
// Routes
////////////////////////////////////////////

//////////////////////////////////////////////
// Server Listener
//////////////////////////////////////////////
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Ahora puede usar el puerto ${PORT}`));
app.use(express.static(__dirname + "/static"));
////////////////////////////////////////////
// Routes
////////////////////////////////////////////
app.get("/", async (req, res) => {
  // get todos
  const pets = await Pet.find({});
  //console.log({ pets });
  const token = req.cookies.token
  const usuario = await Usuario.findOne({token});
  console.log({usuario});
  // render index.ejs
  res.render("index.ejs", { pets , usuario});
});

app.get("/registro", (req, res) => {
  res.render("registro.ejs"); // Renderiza el formulario de registro
});

app.post("/registro", async (req, res) => {
  const { nombre, email, contraseña, role } = req.body;
  console.log("req.body");
  console.log(req.body);
  try {
    const usuario = await Usuario.create({ nombre, email, contraseña, role});
    console.log("Usuario registrado:", usuario);
    res.send("¡Usuario registrado exitosamente!");
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).send("Error al registrar usuario");
    console.log(error);
  }
});

app.get("/iniciosesion", (req, res) => {
  res.render("iniciosesion.ejs"); // Renderiza el formulario de registro
});



app.post("/iniciosesion", async (req, res) => {
  const { email, contraseña } = req.body;
  console.log("req.body");
  console.log(req.body);

  try {
    const usuario = await Usuario.findOne({ email, contraseña });
    console.log({usuario});
    if (usuario) {
      console.log("Usuario autenticado:", usuario);
      
      const updateuser = await Usuario.updateOne(
        { _id: usuario._id },
        { token: String(Date.now()) }
      );
      const usuarioUpdated = await Usuario.findOne({ _id: usuario._id });
      console.log("updateuser");
      console.log(updateuser);
      console.log("usuarioUpdated");
      console.log(usuarioUpdated);
      res.writeHead(200, {
        "Set-Cookie": [ `token=${usuarioUpdated.token}; HttpOnly`,`userid=${usuarioUpdated._id.toString()};HttpOnly`],
        "Access-Control-Allow-Credentials": "true"
      });
      res.end(JSON.stringify({_id:usuarioUpdated._id, token:usuarioUpdated.token}));

    } else {
      res.status(401).json({message:"Credenciales inválidas"});
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({message:"Error al iniciar sesión"});
  }
});


app.get("/plataforma", async (req, res) => {
    if (!req.cookies.token) return res.redirect("/iniciosesion");
    const userId = req.cookies.userid;
    const user = await Usuario.findOne({ _id: userId });
    res.render("plataforma.ejs", { user });

});

app.get("/agregarMascota", (req, res) => {
  res.render("agregarMascota.ejs"); // Renderiza agregar mascota
});

app.post("/agregarMascota", upload.single('imagenes'), async (req, res) => {
  // save the image that was uploaded
  
  console.log("/agregarMascota........")
  const body = req.body;
  console.log({body});
  await Pet.create
  ([
    {
      nombre: body.nombre,
      sexo: body.sexo,
      especie: body.especie,
      raza: body.raza,
      edad: body.edad,
      esterilizado: body.esterilizado,
      vacunas: body.vacunas,
      ubicacion: body.ubicacion,
      cuidadosEspeciales: body.cuidadosEspeciales,
      imagenes: [ req.file.path]
    },
  ]);
  res.end("Mascota agregada exitosamente");
});


app.get("/editar-mascota/:_id", async (req, res) => {
  const petId = req.params._id;
  const pet = await Pet.findOne({_id: petId});
  const token = req.cookies.token;
  const user = await Usuario.findOne({token:token});
  const isUserAdmin = user? user.role === "admin":false;
  res.render("editar-mascota.ejs" , { pet , isUserAdmin }) ;
});

app.post('/editar-mascota/:_id', async (req, res) => {
  const petId = req.params._id;
  const { nombre, sexo, especie, raza, edad, esterilizado, vacunas, ubicacion, cuidadosEspeciales } = req.body;
  console.log({petId, nombre, sexo, especie, raza, edad, esterilizado, vacunas, ubicacion, cuidadosEspeciales })
  const wasUpdated = await Pet.findByIdAndUpdate(petId, { nombre, sexo, especie, raza, edad, esterilizado, vacunas, ubicacion, cuidadosEspeciales });
  res.status(200).json({ mensaje: 'Cambios guardados correctamente', wasUpdated });
});

// Eliminar mascota solo para administradores
app.delete("/eliminar-mascota/:_id", async (req, res) => {
  const token = req.cookies.token;
  const user = await Usuario.findOne({token:token});
  const isUserAdmin = user? user.role === "admin":false;
  const petId = req.params._id;
  if (isUserAdmin) {
    const wasDeleted = await Pet.findByIdAndDelete(petId);
    res.status(200).json({ mensaje: 'Mascota eliminada correctamente', wasDeleted });
  } else {
    res.status(403).json({ mensaje: 'No tienes permisos para eliminar esta mascota' });
  }
});

app.get("/eliminar-mascota/:_id", async (req, res) => {
  const petId = req.params._id;
  await Pet.findByIdAndDelete(petId);
  res.status(200).json({ message: "Mascota eliminada correctamente" });
});

app.get("/adoptar", async (req, res) => {
  const nombreRecibido = req.query.nombre;
  const pet = await Pet.findOne({ nombre: nombreRecibido });
  res.render("adoptar.ejs", { pet });
});

app.post("/adoptar", async (req, res) => {
  const body = req.body;
  console.log(body);
  // res.redirect("/adoptar/gracias")
  await Solicitud.create(body);
  res.redirect("/");
});

app.get("/solicitudes", async (req, res) => {
  const solicitudes = await Solicitud.find({});
  res.render("solicitudes.ejs", { solicitudes });
});

app.post("/adoptar/gracias", async (req, res) => {
  const body = req.body
  res.json({ g: "g" });
});

app.get("/seedpet", async (req, res) => {
  console.log("/seedpet.....");
  await Pet.deleteMany({});

  await Pet.create([
    {
      nombre: "BAHIA",
      sexo: "Hembra",
      especie: "Felino",
      raza: "Criollo",
      edad: "3",
      esterilizado: true,
      vacunas: true,
      ubicacion: "Bogota",
      cuidadosEspeciales: "Ninguno",
      imagenes: [
        "/imagenes-perros/bahia-1.jpg",
        "/imagenes-perros/bahia-2.jpg",
        "/imagenes-perros/bahia-3.jpg",
        "/imagenes-pincipales/appdotamesinfondo.png",
      ],
    },
    {
      nombre: "PANDORA",
      sexo: "Hembra",
      especie: "Canino",
      raza: "Criollo",
      edad: "60",
      esterilizado: true,
      vacunas: true,
      ubicacion: "Bogota",
      cuidadosEspeciales: "Ninguno",
      imagenes: [
        "/imagenes-perros/pandora-1.jpg",
        "/imagenes-perros/pandora-2.jpg",
        "/imagenes-perros/pandora-3.jpg",
        "/imagenes-perros/pandora-4.jpg",
      ],
    },
    {
      nombre: "BIGOTES",
      sexo: "Macho",
      especie: "Conejo",
      raza: "No identifica",
      edad: "5",
      esterilizado: false,
      vacunas: false,
      ubicacion: "Bogota",
      cuidadosEspeciales: "Ninguno",
      imagenes: [
        "/imagenes-perros/bigotes-1.jpg",
        "/imagenes-perros/bigotes-2.jpg",
        "/imagenes-perros/bigotes-3.jpg",
        "/imagenes-pincipales/appdotamesinfondo.png",
      ],
    },
    {
      nombre: "PUMBA",
      sexo: "Macho",
      especie: "Mini-pig",
      raza: "Mini-pig Vietnamita",
      edad: "7",
      esterilizado: true,
      vacunas: true,
      ubicacion: "Bogota",
      cuidadosEspeciales: "Ninguno",
      imagenes: [
        "/imagenes-perros/pumba-1.jpg",
        "/imagenes-perros/pumba-2.jpg",
        "/imagenes-perros/pumba-3.jpg",
        "/imagenes-pincipales/appdotamesinfondo.png",
      ],
    },
    {
      nombre: "MEI",
      sexo: "Hembra",
      especie: "Felino",
      raza: "Criollo",
      edad: "12",
      esterilizado: true,
      vacunas: true,
      ubicacion: "Bogota",
      cuidadosEspeciales: "Ninguno",
      imagenes: [
        "/imagenes-perros/mei-1.jpg",
        "/imagenes-perros/mei-2.jpg",
        "/imagenes-perros/mei-3.jpg",
        "/imagenes-perros/mei-4.jpg",
      ],
    },
    {
      nombre: "TEO",
      sexo: "Macho",
      especie: "Canino",
      raza: "Criollo",
      edad: "12",
      esterilizado: true,
      vacunas: true,
      ubicacion: "Bogota",
      cuidadosEspeciales: "Ninguno",
      imagenes: [
        "/imagenes-perros/teo-1.jpg",
        "/imagenes-perros/teo-2.jpg",
        "/imagenes-perros/teo-3.jpg",
        "/imagenes-perros/teo-4.jpg",
      ],
    },
  ]);
  
  await Usuario.deleteMany({});
  await Usuario.create([
    {
      nombre: "administrador",
      email: "admin@admin.com",
      contraseña: "administrativo",
      role: "admin",
    }
  ]);

  res.redirect("/");
});

app.get("/mascotas/:nombreser", async (req, res) => {
  console.log("/:nombreser");
  const nombreRecibido = req.params.nombreser;
  const pet = await Pet.findOne({ nombre: nombreRecibido });

  // Verificando usuario loggeado
  const userId = req.cookies.userid;
  const token = req.cookies.token;
  const isUserLogged = userId && token;
  res.render("pet.ejs", { pet, isUserLogged });
});

app.post("/todo", async (req, res) => {
  //create the new todo
  await Todo.create(req.body);
  // redirect to main page
  res.redirect("/");
});

app.delete("/todo/:id", async (req, res) => {
  // get the id from params
  const id = req.params.id;
  // delete the todo
  await Todo.findByIdAndDelete(id);
  // redirect to main page
  res.redirect("/");
});
