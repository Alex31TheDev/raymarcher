// parameters
const n = 200,
      eps = 0.001,
      shdw_n = 200,
      shdw_eps = 0.004;

const d_max = 20,
      light_d_max = 100;

const enablePlane = true,
      planeHeight = 0;

let eye_x = 0,
    eye_y = 3,
    eye_z = -13;

let target_x = 0,
    target_y = 0.5,
    target_z = 0;

const persp = 2,
      roll = 0;

let light_x = 3.5,
    light_y = 1.4,
    light_z = -1.6;

const lightInt = 0.7,
      lightAmb = 0.03,
      lightSize = 0.3;

const enableShadows = true;

const bg_r = 0,
      bg_g = 0,
      bg_b = 0;

const drawCrosshair = true,
      drawAxis = true;

const sampleCount = 1;

// errors
class RaymarcherError extends Error {
    constructor(message = "", ...args) {
        super(message, ...args);

        this.name = "RaymarcherError";
        this.message = message;
    }
}

// operators
const Util = {
    fract: (x) => {
        return x - Math.floor(x);
    },
    
    mod: (n, m) => {
        return ((n % m) + m) % m;
    },
    
    mix: (r1, g1, b1, r2, g2, b2, a) => {
        const r3 = r1 * (1 - a) + r2 * a,
              g3 = g1 * (1 - a) + g2 * a,
              b3 = b1 * (1 - a) + b2 * a;
    
        return [r3,
                g3,
                b3];
    }    
};

const Op = {
    // combinations
    union: (a, b, ...args) => {
        let min = a[0] < b[0] ? a : b;

        if (args.length === 0) {
            return min;
        }

        let minMat = min[1];
        min = min[0];

        let i = 0, val, dist;

        for (; i < args.length; i++) {
            val = args[i];
            dist = val[0];

            if (dist < min) {
                min = dist;
                minMat = val[1];
            }
        }

        return [min, minMat];
    },

    subtract: (a, b) => {
        a[0] *= -1;
        return a[0] > b[0] ? a : b;
    },

    // transform
    scale: (sdf, x, y, z, s, ...args) => {
        const p_x = x / s,
              p_y = y / s,
              p_z = z / s;

        const dist = sdf(p_x, p_y, p_z, ...args);
        return dist * s;
    },

    round: (sdf, x, y, z, r, ...args) => {
        const dist = sdf(x, y, z, ...args);
        return dist - r;
    },

    transform: (sdf, x, y, z, mat, ...args) => {
        const [a, b, c,
               d, e, f,
               g, h, i] = mat;

        const n_x = a * x + b * y + z * c,
              n_y = d * x + e * y + z * f,
              n_z = g * x + h * y + z * i;

        return sdf(n_x, n_y, n_z, ...args);
    },

    annular: (sdf, x, y, z, r, ...args) => {
        const dist = sdf(x, y, z, ...args);
        return Math.abs(dist) - r;
    },

    // repetition
    repeat: (x, y, z, s_x, s_y, s_z, l_px = Infinity, l_py = Infinity, l_pz = Infinity, l_nx = -Infinity, l_ny = -Infinity, l_nz = -Infinity) => {
        const r_x = Math.round(x / s_x),
              r_y = Math.round(y / s_y),
              r_z = Math.round(z / s_z);

        const c_x = Math.max(Math.min(r_x, l_px), l_nx),
              c_y = Math.max(Math.min(r_y, l_py), l_ny),
              c_z = Math.max(Math.min(r_z, l_pz), l_nz);

        const q_x = x - s_x * c_x,
              q_y = y - s_y * c_y,
              q_z = z - s_z * c_z;

        return [q_x,
                q_y,
                q_z];
    },

    // 2D -> 3D
    extrude: (sdf, x, y, z, pos_x, pos_y, pos_z, h, ...args) => {
        const n_x = x - pos_x,
              n_y = y - pos_y,
              n_z = z - pos_z;

        let dist = sdf(n_x, n_y, ...args),
            w = Math.abs(n_z) - h;

        const a = Math.min(Math.max(dist, w), 0);

        dist = Math.max(dist, 0);
        w = Math.max(w, 0);

        return Math.sqrt(dist * dist +
                         w    * w)
               + a;
    },

    revolve: (sdf, x, y, z, pos_x, pos_y, pos_z, o, ...args) => {
        const n_x = x - pos_x,
              n_y = y - pos_y,
              n_z = z - pos_z;

        const mag = Math.sqrt(n_x * n_x +
                              n_z * n_z);

        return sdf(mag - o, n_y, ...args);
    }
};

// SDF
const SDF2D = {
    circle: (x, y, pos_x, pos_y, r) => {
        const n_x = x - pos_x,
              n_y = y - pos_y;

        return Math.sqrt(n_x * n_x +
                         n_y * n_y)
               - r;
    },

    polygon: (x, y, pos_x, pos_y, v) => {
        const n_x = x - pos_x,
              n_y = y - pos_y;

        const num = v.length;

        const diff_x = n_x - v[0].x,
              diff_y = n_y - v[0].y;

        let d = diff_x * diff_x +
                diff_y * diff_y;

        let i = 0, j = num - 1, s = 1;

        for (; i < num; j = i, i++) {
            const e_x = v[j].x - v[i].x,
                  e_y = v[j].y - v[i].y;

            const w_x = n_x - v[i].x,
                  w_y = n_y - v[i].y;

            const we_dot = w_x * e_x +
                           w_y * e_y;

            const ee_dot = e_x * e_x +
                           e_y * e_y;

            const dot_clamp = Math.min(Math.max(we_dot / ee_dot, 0), 1);

            const b_x = w_x - e_x * dot_clamp;
                  b_y = w_y - e_y * dot_clamp;

            const bb_dot = b_x * b_x +
                           b_y * b_y;

            d = Math.min(d, bb_dot);

            const cond_a = n_y >= v[i].y,
                  cond_b = n_y  < v[j].y,
                  cond_c = e_x * w_y > e_y * w_x;

            if (( cond_a &&  cond_b &&  cond_c) ||
                (!cond_a && !cond_b && !cond_c)) {
                s = -s;
            }
        }

        return s * Math.sqrt(d);
    }
};

const SDF3D = {
    sphere: (x, y, z, pos_x, pos_y, pos_z, r) => {
        const n_x = x - pos_x,
              n_y = y - pos_y,
              n_z = z - pos_z;

        return Math.sqrt(n_x * n_x +
                         n_y * n_y +
                         n_z * n_z)
               - r;
    },

    plane: (x, y, z, h = 0, pos_x = 0, pos_y = 0, pos_z = 0, n_x = 0, n_y = 1, n_z = 0) => {
        const p_x = (x - pos_x) * n_x,
              p_y = (y - pos_y) * n_y,
              p_z = (z - pos_z) * n_z;

        return p_x + p_y + p_z
               + h;
    },

    box: (x, y, z, a_x, a_y, a_z, b_x, b_y, b_z) => {
        const q_x = Math.abs(x - a_x) - b_x,
              q_y = Math.abs(y - a_y) - b_y,
              q_z = Math.abs(z - a_z) - b_z;

        const m_x = Math.max(q_x, 0),
              m_y = Math.max(q_y, 0),
              m_z = Math.max(q_z, 0);

        return Math.sqrt(m_x * m_x +
                         m_y * m_y +
                         m_z * m_z) +
               Math.min(Math.max(q_x, Math.max(q_y, q_z)), 0);
    },

    capsule: (x, y, z, pos_x, pos_y, pos_z, h, r) => {
        const n_x = x - pos_x,
              n_z = z - pos_z;

        let n_y = y - pos_y;
        n_y -= Math.min(Math.max(n_y, 0), h);

        return Math.sqrt(n_x * n_x +
                         n_y * n_y +
                         n_z * n_z) - r;
    },

    cylinder: (x, y, z, a_x, a_y, a_z, b_x, b_y, b_z, r) => {
        const pa_x = x - a_x,
              pa_y = y - a_y,
              pa_z = z - a_z;

        const ba_x = b_x - a_x,
              ba_y = b_y - a_y,
              ba_z = b_z - a_z;

        const ba_ba = ba_x * ba_x + ba_y * ba_y,
              pa_ba = pa_x * ba_x + pa_y * ba_y;

        const q_x = pa_x * ba_ba - ba_x * pa_ba,
              q_y = pa_y * ba_ba - ba_y * pa_ba,
              q_z = pa_z * ba_ba - ba_z * pa_ba;

        const _x = Math.sqrt(q_x * q_x +
                             q_y * q_y +
                             q_z * q_z)
                   - r * ba_ba,
              _y = Math.abs(pa_ba * ba_ba * 0.5)
                   - ba_ba * 0.5;

        const x2 = _x * _x,
              y2 = _y * _y * ba_ba;

        let d = Math.max(_x, _y) < 0 ? -Math.min(x2, y2): (
                (_x > 0 ? x2 : 0) +
                (_y > 0 ? y2 : 0)
            );

        d = Math.sign(d) * Math.sqrt(Math.abs(d)) / ba_ba;
        return d;
    },

    torus: (x, y, z, pos_x, pos_y, pos_z, ri, re) => {
        const n_x = x - pos_x,
              n_y = y - pos_y,
              n_z = z - pos_z;

        const q = Math.sqrt(n_x * n_x +
                            n_z * n_z)
                  - re;

        return Math.sqrt(q * q +
                         n_y * n_y)
               - ri;
    }
};

// scene
function genVertices(n, r, a = 0) {
    const v = [];

    for (let i = 0; i < n; i++) {
        const x = r * Math.cos(2 * Math.PI * i / n + a),
              y = r * Math.sin(2 * Math.PI * i / n + a);

        v.push({
            x,
            y
        });
    }

    return v;
}

const polyCount = 7,
      r = 1,
      gap = 0.2,
      thickness = 0.2;

const x_pos =  Array(polyCount).fill().map((_, i) => {
    const pos = i - polyCount / 2 + gap / 2,
          dist = 2 * (r + gap);

    return dist * pos + 1;
}),

      verts = Array(polyCount).fill().map((_, i) => {
    let n = (i + 3), a = 0;

    if (n % 4 === 0) {
        a = Math.PI / n;
    } else if (n % 2 === 1) {
        a = Math.PI / 2;
    }

    return genVertices(n, r, a);
}),

      height = Array(polyCount).fill().map((_, i) => {
    const n = (i + 3);
    return Math.cos(Math.PI / n);
});

function sceneSdf(x, y, z) {
    let res = [Infinity, -1];

    for (let i = 0; i < polyCount; i++) {
        res = Op.union(
            res,
            [
                Op.extrude(SDF2D.polygon, x, y, z, x_pos[i], height[i], 0, thickness, 0, 0, verts[i]),
                5
            ]
        )
    }

    return res;

    /*[Op.union(
        [SDF3D.sphere(x, y, z, 1.4142135623730951 + 0.1, 1, -1.4142135623730951 - 0.1, 1), 2],
        [SDF3D.sphere(x, y, z, 0, 1, 0, 1), 3],
        [SDF3D.sphere(x, y, z, -1.4142135623730951 - 0.1, 1, 1.4142135623730951 + 0.1, 1), 4]
    );*/
}

// camera
class Camera {
    constructor(pos, target, opts = {}) {
        this.aspect = img.w / img.h;
        this.w1 =  2 / img.w;
        this.h1 = -2 / img.h;

        this.pos = pos;
        const [eye_x,
               eye_y,
               eye_z] = pos;

        this.eye_x = eye_x;
        this.eye_y = eye_y;
        this.eye_z = eye_z;

        this.target = target;
        const [target_x,
               target_y,
               target_z] = target;

        this.target_x = target_x;
        this.target_y = target_y;
        this.target_z = target_z;

        this.persp = opts.persp ?? 2;
        this.roll = opts.roll ?? 0;

        this.far = opts.far ?? 1;
        this.near = opts.near ?? -1;

        this.setScreenPoints();
        this.updateMatrices();
    }

    getScreenCoords(x, y) {
        const sc_x = x * this.w1 - 1,
              sc_y = y * this.h1 + 1;

        return [sc_x * this.aspect,
                sc_y];
    }

    offsetScreenCoords(x, y, dx, dy) {
        const n_x = x + dx * this.w1 * this.aspect,
              n_y = y + dy * this.h1;

        return [n_x,
                n_y];
    }

    setScreenPoints() {
        this.left = this.getScreenCoords(0, 0)[0];
        this.right = this.getScreenCoords(img.w, 0)[0];

        this.top = this.getScreenCoords(0, 0)[1];
        this.bottom = this.getScreenCoords(0, img.h)[1];
    }

    getViewMatrix() {
        let fwd_x = this.target_x - this.eye_x,
            fwd_y = this.target_y - this.eye_y,
            fwd_z = this.target_z - this.eye_z;

        let mag = Math.sqrt(fwd_x * fwd_x +
                            fwd_y * fwd_y +
                            fwd_z * fwd_z);

        if (mag > 0) {
            mag = 1 / mag;

            fwd_x *= mag;
            fwd_y *= mag;
            fwd_z *= mag;
        }

        const roll_x = Math.sin(this.roll),
              roll_y = Math.cos(this.roll),
              roll_z = 0;

        let right_x =  roll_y * fwd_z - roll_z * fwd_y,
            right_y = -roll_x * fwd_z + roll_z * fwd_x,
            right_z =  roll_x * fwd_y - roll_y * fwd_x;

        mag = Math.sqrt(right_x * right_x +
                        right_y * right_y +
                        right_z * right_z);

        if (mag > 0) {
            mag = 1 / mag;

            right_x *= mag;
            right_y *= mag;
            right_z *= mag;
        }

        let up_x =  fwd_y * right_z - fwd_z * right_y,
            up_y = -fwd_x * right_z + fwd_z * right_x,
            up_z =  fwd_x * right_y - fwd_y * right_x;

        mag = 1 / Math.sqrt(up_x * up_x +
                            up_y * up_y +
                            up_z * up_z);

        if (mag > 0) {
            mag = 1 / mag;

            up_x *= mag;
            up_y *= mag;
            up_z *= mag;
        }

        fwd_x *= this.persp;
        fwd_y *= this.persp;
        fwd_z *= this.persp;

        const viewMatrix = [right_x, up_x, fwd_x,
                            right_y, up_y, fwd_y,
                            right_z, up_z, fwd_z];

        return viewMatrix;
    }

    getOrthoMatrix() {
        const left = this.left, right  = this.right,
              top  = this.top,  bottom = this.bottom,
              near = this.near, far    = this.far;

        const orthoMatrix = [2 / (right - left), 0,                   0,                -(right + left) / (right - left),
                             0,                  2 / (top - bottom),  0,                -(top + bottom) / (top - bottom),
                             0,                  0,                  -2 / (far - near), -(far + near)   / (far - near),
                             0,                  0,                   0,                 1                               ];

        return orthoMatrix;
    }

    updateMatrices() {
        this.orthoMatrix = this.getOrthoMatrix();
        this.viewMatrix = this.getViewMatrix();
    }

    viewTransform(x, y, z) {
        const [a, b, c,
               d, e, f,
               g, h, i] = this.viewMatrix;

        const n_x = a * x + b * y + z * c,
              n_y = d * x + e * y + z * f,
              n_z = g * x + h * y + z * i;

        return [n_x, n_y, n_z];
    }

    orthoProject(x, y, z) {
        const a = this.orthoMatrix[0],
              d = this.orthoMatrix[3],
              f = this.orthoMatrix[5],
              h = this.orthoMatrix[7];

        const n_x = a * x + d,
              n_y = f * y + h;

        const x_sc = ((n_x + 1) / 2) * img.w,
              y_sc = ((1 - n_y) / 2) * img.h;

        return [x_sc, y_sc];
    }
}

// raymarcher
class Raymarcher {
    static backgroundMaterialId = -1;
    static planeMaterialId = 0;
    static undefinedMaterialId = 1;

    constructor(sdf, origin, opts = {}) {
        this.objSdf = sdf;

        this.origin = origin;
        const [org_x,
               org_y,
               org_z] = origin;

        this.org_x = org_x;
        this.org_y = org_y;
        this.org_z = org_z;

        this.opts = opts;

        this.n = opts.n ?? 100;
        this.eps = opts.eps ?? 0.001;

        this.d_min = opts.d_min ?? 1;
        this.d_max = opts.d_max ?? 100;

        this.enablePlane = opts.enablePlane ?? true;
        this.planeHeight = opts.planeHeight ?? 0;

        this.updateSdf();
    }

    getSceneSdf() {
        if (!this.enablePlane) {
            return this.objSdf;
        }

        return function(x, y, z) {
            const objDist = this.objSdf(x, y, z),
                  planeDist = SDF3D.plane(x, y, z, this.planeHeight);

            return Op.union(
                objDist,
                [planeDist, Raymarcher.planeMaterialId]
            );
        }
    }

    updateSdf() {
        this.sceneSdf = this.getSceneSdf();
    }

    getRayDirection(x, y, camera) {
        let dir_x = x,
            dir_y = y,
            dir_z = 1;

        if (typeof camera !== "undefined") {
            [dir_x,
             dir_y,
             dir_z] = camera.viewTransform(dir_x,
                                           dir_y,
                                           dir_z);
        }

        let mag = Math.sqrt(dir_x * dir_x +
                            dir_y * dir_y +
                            dir_z * dir_z);

        if (mag > 0) {
            mag = 1 / mag;

            dir_x *= mag;
            dir_y *= mag;
            dir_z *= mag;
        }

        return [dir_x,
                dir_y,
                dir_z];
    }

    getRayDifferential(x, y, camera) {
        const [off_x,
               off_y] = camera.offsetScreenCoords(x, y, 1, 1);

        let rdx_x = off_x,
            rdx_y = y,
            rdx_z = 1;
        
        let mag = Math.sqrt(rdx_x * rdx_x +
                            rdx_y * rdx_y +
                            rdx_z * rdx_z);

        if (mag > 0) {
            mag = 1 / mag;

            rdx_x *= mag;
            rdx_y *= mag;
            rdx_z *= mag;
        }
        
        let rdy_x = x,
            rdy_y = off_y,
            rdy_z = 1;

        mag = Math.sqrt(rdy_x * rdy_x +
                        rdy_y * rdy_y +
                        rdy_z * rdy_z);

        if (mag > 0) {
            mag = 1 / mag;

            rdy_x *= mag;
            rdy_y *= mag;
            rdy_z *= mag;
        }

        if (typeof camera !== "undefined") {
            [rdx_x,
             rdx_y,
             rdx_z] = camera.viewTransform(rdx_x,
                                           rdx_y,
                                           rdx_z);

            [rdy_x,
             rdy_y,
             rdy_z] = camera.viewTransform(rdy_x,
                                           rdy_y,
                                           rdy_z);
        }

        return [
            [rdx_x,
             rdx_y,
             rdx_z],

            [rdy_x,
             rdy_y,
             rdy_z]
        ];
    }

    raytracePlane(dir) {
        const [dir_x,
               dir_y,
               dir_z] = dir;

        const tp1 = -this.org_y / dir_y;
        
        if (tp1 <= 0) {
            const rt_res = [
                [0,
                 0,
                 0],

                Raymarcher.backgroundMaterialId,
                -1
            ];

            return [
                this.d_max,
                rt_res
            ];
        }

        const d_max = Math.min(this.d_max, tp1),
              dist = -(this.org_y + this.planeHeight) / dir_y;

        const p_x = this.org_x + dist * dir_x,
              p_y = -this.planeHeight,
              p_z = this.org_z + dist * dir_z;
              
        const rt_res = [
            [p_x,
             p_y,
             p_z],

            Raymarcher.planeMaterialId,
            dist
        ];

        return [
            d_max,
            rt_res
        ];
    }

    raymarchObjs(dir, d_max) {
        const [dir_x,
               dir_y,
               dir_z] = dir;

        let i = 0, sum = this.d_min;
        let dist, c_mat;

        let p_x, p_y, p_z;

        for (; i < this.n && sum < d_max; i++) {
            p_x = this.org_x + sum * dir_x;
            p_y = this.org_y + sum * dir_y;
            p_z = this.org_z + sum * dir_z;

            [dist, c_mat] = this.sceneSdf(p_x,
                                          p_y,
                                          p_z);

            if (isNaN(dist)) {
                throw new RaymarcherError("Distance is NaN");
            }

            if (typeof c_mat === "undefined") {
                c_mat = Raymarcher.undefinedMaterialId;
            }

            sum += dist;

            if (dist < this.eps) {
                return [
                    [p_x,
                     p_y,
                     p_z],

                    c_mat, sum
                ];
            }
        }

        return [
            [0,
             0,
             0],

            Raymarcher.backgroundMaterialId,
            -1
        ];
    }

    raycastScene(dir) {
        if (!this.enablePlane) {
            return this.raymarchObjs(dir, this.d_max);
        }

        const [d_max, rt_res] = this.raytracePlane(dir),
              rm_res = this.raymarchObjs(dir, this.d_max);

        let [point,
             c_mat, sum] = rm_res;

        if (sum === -1) {
            const [rt_point,
                   rt_mat, rt_dist] = rt_res;

            point = rt_point;

            c_mat = rt_mat;
            sum = rt_dist;
        }

        return [point,
                c_mat, sum];
    }

    projectToPlane(dir, rdx, rdy) {
        const [dir_x,
               dir_y,
               dir_z] = dir;

        const [rdx_x,
               rdx_y,
               rdx_z] = rdx;

        const [rdy_x,
               rdy_y,
               rdy_z] = rdy;

        const dir_py_x = dir_x / dir_y,
              dir_py_z = dir_z / dir_y;  

        const dp_dx_x = this.org_y * (dir_py_x - rdx_x / rdx_y),
              dp_dx_y = -this.planeHeight,
              dp_dx_z = this.org_y * (dir_py_z - rdx_z / rdx_y);

        const dp_dy_x = this.org_y * (dir_py_x - rdy_x / rdy_y),
              dp_dy_y = -this.planeHeight,
              dp_dy_z = this.org_y * (dir_py_z - rdy_z / rdy_y);

        return [
            [dp_dx_x,
             dp_dx_y,
             dp_dx_z],

            [dp_dy_x,
             dp_dy_y,
             dp_dy_z],
        ];
    }
}

// lighting
class LightingModel {
    constructor(sdf, light, opts = {}) {
        this.objSdf = sdf;

        this.light = light;
        const [light_x,
               light_y,
               light_z] = light;

        this.light_x = light_x;
        this.light_y = light_y;
        this.light_z = light_z;

        this.opts = opts;

        this.eps = opts.eps ?? 0.01;
        this.d_min = opts.d_min ?? 0.01;
        this.d_max = opts.d_max ?? 100;

        this.lightInt = opts.lightInt ?? 0.7;
        this.lightAmb = opts.lightAmb ?? 0.1;

        this.shadowLightSize = opts.shadowLightSize ?? 1;
        this.shadowIter = opts.shadowIter ?? 100;
        this.shadowEps = opts.shadowEps ?? 0.001;

        this.phongExp = opts.phongExp ?? 16;
        this.phongSoftness = opts.phongSoftness ?? 5;
    }

    getPointNormal(point) {
        const [x,
               y,
               z] = point;

        const [d1] = this.objSdf(x + this.eps,
                                 y - this.eps,
                                 z - this.eps),

              [d2] = this.objSdf(x - this.eps,
                                 y - this.eps,
                                 z + this.eps),

              [d3] = this.objSdf(x - this.eps,
                                 y + this.eps,
                                 z - this.eps),

              [d4] = this.objSdf(x + this.eps,
                                 y + this.eps,
                                 z + this.eps);

        let norm_x =  this.eps * d1 - this.eps * d2 - this.eps * d3 + this.eps * d4,
            norm_y = -this.eps * d1 - this.eps * d2 + this.eps * d3 + this.eps * d4,
            norm_z = -this.eps * d1 + this.eps * d2 - this.eps * d3 + this.eps * d4;

        let mag = Math.sqrt(norm_x * norm_x +
                            norm_y * norm_y +
                            norm_z * norm_z);

        if (mag > 0) {
            mag = 1 / mag;

            norm_x *= mag;
            norm_y *= mag;
            norm_z *= mag;
        }

        return [norm_x,
                norm_y,
                norm_z];
    }

    calcDiffuse(point) {
        const [x,
               y,
               z] = point;

        let lp_x = this.light_x - x,
            lp_y = this.light_y - y,
            lp_z = this.light_z - z;

        const mag_sq = lp_x * lp_x +
                       lp_y * lp_y +
                       lp_z * lp_z;

        let mag = Math.sqrt(mag_sq);

        if (mag > 0) {
            mag = 1 / mag;

            lp_x *= mag;
            lp_y *= mag;
            lp_z *= mag;
        }

        const [norm_x,
               norm_y,
               norm_z] = this.getPointNormal(point);

        const nl_dot = norm_x * lp_x +
                       norm_y * lp_y +
                       norm_z * lp_z;

        let diff = nl_dot * this.lightInt;
        diff = Math.min(this.lightAmb + Math.max(diff, 0), 1);

        return diff;
    }

    calcSpecular(point, dir) {
        const [dir_x,
               dir_y,
               dir_z] = dir;

        let lp_x = this.light_x,
            lp_y = this.light_y,
            lp_z = this.light_z;

        let mag = Math.sqrt(lp_x * lp_x +
                            lp_y * lp_y +
                            lp_z * lp_z);

        if (mag > 0) {
            mag = 1 / mag;

            lp_x *= mag;
            lp_y *= mag;
            lp_z *= mag;
        }

        let hal_x = lp_x - dir_x,
            hal_y = lp_y - dir_y,
            hal_z = lp_z - dir_z;

        mag = Math.sqrt(hal_x * hal_x +
                        hal_y * hal_y +
                        hal_z * hal_z);

        if (mag > 0) {
            mag = 1 / mag;

            hal_x *= mag;
            hal_y *= mag;
            hal_z *= mag;
        }

        const [norm_x,
               norm_y,
               norm_z] = this.getPointNormal(point);

        const nh_dot = norm_x * hal_x +
                       norm_y * hal_y +
                       norm_z * hal_z;

        const hl_dot = hal_x * lp_x +
                       hal_y * lp_y +
                       hal_z * lp_z;

        let spec = Math.pow(Math.min(Math.max(nh_dot, 0), 1), this.phongExp);

        const brdf = Math.pow(Math.min(1 - Math.max(hl_dot, 0), 1), this.phongSoftness);
        spec *= 0.6 + brdf;

        spec = Math.min(this.lightAmb + Math.max(this.lightInt * spec, 0), 1);

        return spec;
    }

    calcSoftShadow(point) {
        const [x,
               y,
               z] = point;

        let lp_x = this.light_x,
            lp_y = this.light_y,
            lp_z = this.light_z;

        let mag = Math.sqrt(lp_x * lp_x +
                            lp_y * lp_y +
                            lp_z * lp_z);

        if (mag > 0) {
            mag = 1 / mag;

            lp_x *= mag;
            lp_y *= mag;
            lp_z *= mag;
        }

        let i = 0, sum = this.d_min;
        let dist, res = 1, s;

        let p_x, p_y, p_z;

        for (; i < this.shadowIter && sum < this.d_max; i++) {
            p_x = x + sum * lp_x;
            p_y = y + sum * lp_y;
            p_z = z + sum * lp_z;

            [dist] = this.objSdf(p_x,
                                 p_y,
                                 p_z);

            s = Math.min(Math.max(8 * dist / (this.shadowLightSize * sum), 0), 1);
            res = Math.min(res, s);

            sum += Math.min(Math.max(dist, 0.01), 0.2);

            if (res < this.shadowEps || sum > d_max) {
                break;
            }
        }

        res = res * res * (3 - 2 * res);
        res = Math.min(Math.max(this.lightAmb + res, 0), 1);

        return res
    }
}

// materials
class BaseMaterial {
    constructor() {}

    getColor() {
        return [0,
                0,
                0];
    }
}

class SolidMaterial extends BaseMaterial {
    constructor(color = []) {
        super();

        this.color = color;
    }

    get color() {
        return this._color;
    }

    set color(color) {
        let [clr_r,
             clr_g,
             clr_b] = color;

        clr_r ??= 1;
        clr_g ??= 1;
        clr_b ??= 1;

        this.clr_r = clr_r;
        this.clr_g = clr_g;
        this.clr_b = clr_b;

        this._color = [clr_r,
                       clr_g,
                       clr_b];
    }

    getColor() {
        return [this.clr_r,
                this.clr_g,
                this.clr_b];
    }
}

class DiffuseMaterial extends BaseMaterial {
    constructor(color = [], mult = 1) {
        super();

        this.color = color;

        this.mult = mult;
    }

    get color() {
        return this._color;
    }

    set color(color) {
        let [clr_r,
             clr_g,
             clr_b] = color;

        clr_r ??= 1;
        clr_g ??= 1;
        clr_b ??= 1;

        this.clr_r = clr_r;
        this.clr_g = clr_g;
        this.clr_b = clr_b;

        this._color = [clr_r,
                       clr_g,
                       clr_b];
    }

    getColor(point) {
        const a = this.mult * renderer.lighting.calcDiffuse(point);

        const b = Math.min(Math.max(a, 0), 1);

        return [b * this.clr_r,
                b * this.clr_g,
                b * this.clr_b];
    }
}

class SpecularMaterial extends BaseMaterial {
    constructor(color = [], mult = 1) {
        super();

        this.color = color;

        this.mult = mult;
    }

    get color() {
        return this._color;
    }

    set color(color) {
        let [clr_r,
             clr_g,
             clr_b] = color;

        clr_r ??= 1;
        clr_g ??= 1;
        clr_b ??= 1;

        this.clr_r = clr_r;
        this.clr_g = clr_g;
        this.clr_b = clr_b;

        this._color = [clr_r,
                       clr_g,
                       clr_b];
    }

    getColor(point, dir) {
        const a = this.mult * renderer.lighting.calcSpecular(point, dir);

        const b = Math.min(Math.max(a, 0), 1);

        return [b * this.clr_r,
                b * this.clr_g,
                b * this.clr_b];
    }
}

class SpecularDiffuseMaterial extends BaseMaterial {
    constructor(color = [], diffMult = 1, specMult = 1) {
        super();

        this.color = color;

        this.diffMult = diffMult;
        this.specMult = specMult;
    }

    get color() {
        return this._color;
    }

    set color(color) {
        let [clr_r,
             clr_g,
             clr_b] = color;

        clr_r ??= 1;
        clr_g ??= 1;
        clr_b ??= 1;

        this.clr_r = clr_r;
        this.clr_g = clr_g;
        this.clr_b = clr_b;

        this._color = [clr_r,
                       clr_g,
                       clr_b];
    }

    getColor(point, dir) {
        const a = this.diffMult * renderer.lighting.calcDiffuse(point),
              b = this.specMult * renderer.lighting.calcSpecular(point, dir);

        const c = Math.min(Math.max(a + b, 0), 1);

        return [c * this.clr_r,
                c * this.clr_g,
                c * this.clr_b];
    }
}

class CheckerMaterial extends BaseMaterial {
    constructor(color_1 = [], color_2 = [], opts = {}) {
        super();

        this.color_1 = color_1;
        this.color_2 = color_2;

        this.opts = opts;

        this.checkerSize = opts.checkerSize ?? 3;
        this.blurFactor = opts.blurFactor ?? 0.001;
    }

    get color_1() {
        return this._color_1;
    }

    set color_1(color) {
        let [clr_r,
             clr_g,
             clr_b] = color;

        clr_r ??= 0.5;
        clr_g ??= 0.5;
        clr_b ??= 0.5;

        this.clr_1_r = clr_r;
        this.clr_1_g = clr_g;
        this.clr_1_b = clr_b;

        this._color_1 = [clr_r,
                         clr_g,
                         clr_b];
    }

    get color_2() {
        return this._color_2;
    }

    set color_2(color) {
        let [clr_r,
             clr_g,
             clr_b] = color;

        clr_r ??= 1;
        clr_g ??= 1;
        clr_b ??= 1;

        this.clr_2_r = clr_r;
        this.clr_2_g = clr_g;
        this.clr_2_b = clr_b;

        this._color_2 = [clr_r,
                         clr_g,
                         clr_b];
    }

    get checkerSize() {
        return this._checkerSize;
    }

    set checkerSize(size) {
        this._checkerSize = size;
        this.checkerFactor = 1 / size;
    }

    getColor(point, dp_dx, dp_dy) {
        const x = point[0] * this.checkerFactor,
              y = point[2] * this.checkerFactor;

        const dp_dx_x = dp_dx[0] * this.checkerFactor,
              dp_dx_y = dp_dx[2] * this.checkerFactor;

        const dp_dy_x = dp_dy[0] * this.checkerFactor,
              dp_dy_y = dp_dy[2] * this.checkerFactor;

        const w_x = Math.abs(dp_dx_x) + Math.abs(dp_dy_x) + this.blurFactor,
              w_y = Math.abs(dp_dx_y) + Math.abs(dp_dy_y) + this.blurFactor;

        const fx_1 = (x - 0.5 * w_x) * 0.5,
              fy_1 = (y - 0.5 * w_y) * 0.5,
              fx_2 = (x + 0.5 * w_x) * 0.5,
              fy_2 = (y + 0.5 * w_y) * 0.5;

        const i_x = 2 * (
                        Math.abs(fx_1 - Math.floor(fx_1) - 0.5) -
                        Math.abs(fx_2 - Math.floor(fx_2) - 0.5)
                    ) / w_x,

              i_y = 2 * (
                        Math.abs(fy_1 - Math.floor(fy_1) - 0.5) -
                        Math.abs(fy_2 - Math.floor(fy_2) - 0.5)
                    ) / w_y; 

        let a = 0.5 - 0.5 * i_x * i_y;
        a = Math.min(Math.max(a, 0), 1);

        return Util.mix(this.clr_1_r, this.clr_1_g, this.clr_1_b,
                        this.clr_2_r, this.clr_2_g, this.clr_2_b,
                        a);
    }
}

const backgroundMaterial = new SolidMaterial(
    [bg_r,
     bg_g,
     bg_b]
),

      planeMaterial = new CheckerMaterial(
    Colors.gray.normalize(),
    Colors.darkGray.normalize()
);

const Materials = new Map();

Materials.set(1, new DiffuseMaterial(
    [1,
     1,
     1]
));

Materials.set(2, new DiffuseMaterial(
    [1,
     0,
     0]
));

Materials.set(3, new SpecularMaterial(
    [0,
     1,
     0]
));

Materials.set(4, new SpecularDiffuseMaterial(
    [0,
     0,
     1],
    1, 0.5
));

Materials.set(5, new SpecularDiffuseMaterial(
    Colors.royalBlue.normalize(),
    1, 0.5
));

function getMaterial(id) {
    switch(id) {
        case Raymarcher.backgroundMaterialId:
            return backgroundMaterial;
        case Raymarcher.planeMaterialId:
            return planeMaterial;
    }

    const material = Materials.get(id);

    if (typeof material === "undefined") {
        throw new RaymarcherError("Invalid material " + material.toString());
    }

    return material;
}

// renderer
class Renderer {
    constructor(cameraOpts, raymarcherOpts, lightingOpts, opts = {}) {
        this.camera = new Camera(...cameraOpts);
        this.raymarcher = new Raymarcher(...raymarcherOpts);
        this.lighting = new LightingModel(...lightingOpts);

        this.opts = opts;

        this.sampleCount = opts.sampleCount ?? 1;
        this.gammaCorrect = opts.gammaCorrect ?? true;

        this.enableShadows = opts.enableShadows ?? false;

        this.enableAxis = opts.drawAxis ?? true;
        this.enableCrosshair = opts.drawCrosshair ?? true;
        this.axisSize = opts.axisSize ?? 15;
    }

    get enableAA() {
        return this.sampleCount > 1;
    }

    get axisSize() {
        return this.axisSize;
    }

    set axisSize(size) {
        this._axisSize = size;
        this.axisScale = 2 * size / img.w;
    }

    fragFunc(x, y) {
        const dir = this.raymarcher.getRayDirection(x, y, this.camera);

        const [point, mat_id] = this.raymarcher.raycastScene(dir),
              material = getMaterial(mat_id);

        let r, g, b;

        if (mat_id === Raymarcher.planeMaterialId) {
            const [rdx, rdy] = this.raymarcher.getRayDifferential(x, y, this.camera),
                  [dp_dx, dp_dy] = this.raymarcher.projectToPlane(dir, rdx, rdy);

            [r,
             g,
             b] = material.getColor(point, dp_dx, dp_dy);

            if (this.enableShadows) {
                const shadow = this.lighting.calcSoftShadow(point);

                r *= shadow;
                g *= shadow;
                b *= shadow;
            }
        } else {
            [r,
             g,
             b] = material.getColor(point, dir);
        }
        
        return [r,
                g,
                b];
    }

    getSamples(x, y) {
        if (!this.enableAA) {
            return this.fragFunc(x, y);
        }

        let sum_r = 0,
            sum_g = 0,
            sum_b = 0;
        let count = 0;

        let r, g, b;
        let i = 0, j,
            x_off, y_off,
            aa_x, aa_y;

        const count2 = this.sampleCount / 2;

        for (; i < this.sampleCount; i++) {
            x_off = (i - count2) / this.sampleCount - 0.5;

            for (j = 0; j < this.sampleCount; j++) {
                y_off = (j - count2) / this.sampleCount - 0.5;

                [aa_x,
                 aa_y] = this.camera.offsetScreenCoords(x, y,
                                                        x_off, y_off);

                [r,
                 g,
                 b] = this.fragFunc(aa_x, aa_y);

                sum_r += r;
                sum_g += g;
                sum_b += b;

                count++;
            }
        }

        return [sum_r / count,
                sum_g / count,
                sum_b / count];
    }

    drawScreen() {
        let y = 0, x,
            pos = 0;

        let sc_x, sc_y;
        let r, g, b;

        for (; y < img.h; y++) {
            for (x = 0; x < img.w; x++) {
                [sc_x,
                 sc_y] = this.camera.getScreenCoords(x, y);

                [r,
                 g,
                 b] = this.getSamples(sc_x, sc_y);

                r = Math.min(Math.max(r, 0), 1);
                g = Math.min(Math.max(g, 0), 1);
                b = Math.min(Math.max(b, 0), 1);

                if (this.gammaCorrect) {
                    r = Math.pow(r, 0.4545);
                    g = Math.pow(g, 0.4545);
                    b = Math.pow(b, 0.4545);
                }

                img.pixels[pos++] = ~~(r * 255);
                img.pixels[pos++] = ~~(g * 255);
                img.pixels[pos++] = ~~(b * 255);
            }
        }
    }

    drawAxis(rightColor, upColor, fwdColor) {
        const mid_x = img.w / 2,
              mid_y = img.h / 2;

        let right_x = this.camera.viewMatrix[0],
            right_y = this.camera.viewMatrix[3],
            
            up_x = this.camera.viewMatrix[1],
            up_y = this.camera.viewMatrix[4],

            fwd_x = this.camera.viewMatrix[2] / this.camera.aspect,
            fwd_y = this.camera.viewMatrix[5] / this.camera.aspect;

        right_x *= this.axisScale;
        right_y *= this.axisScale;

        up_x *= this.axisScale;
        up_y *= this.axisScale;
        
        fwd_x *= this.axisScale;
        fwd_y *= this.axisScale;

        const projRight = this.camera.orthoProject(right_x,
                                                   right_y),

              projUp =    this.camera.orthoProject(up_x,
                                                   up_y),

              projFwd =   this.camera.orthoProject(fwd_x,
                                                   fwd_y);

        img.drawLine(
            mid_x, mid_y,
            ...projRight,
            rightColor
        );

        img.drawLine(
            mid_x, mid_y,
            ...projUp,
            upColor
        );

        img.drawLine(
            mid_x, mid_y,
            ...projFwd,
            fwdColor
        );
    }

    drawCrosshair(crosshairColor, linesColor) {
        const mid_x = img.w / 2,
              mid_y = img.h / 2;

        if (linesColor !== null && typeof linesColor !== "undefined") {
            img.drawLine(0,     mid_y + 1, img.w, mid_y + 1, linesColor);
            img.drawLine(mid_x, 0,         mid_x, img.h,     linesColor);
        }

        img.circleBres(mid_x, mid_y, 2, crosshairColor);
    }

    render() {
        this.drawScreen();

        if (this.enableAxis) {
            this.drawAxis(Colors.red, Colors.green, Colors.blue);
        }

        if (this.enableCrosshair) {
            this.drawCrosshair(Colors.yellow);
        }
    }
}

eye_x *= Math.cos(0.02 * idx  + Math.PI / 4);
eye_z *= Math.sin(0.02 * idx + Math.PI / 4);

const cameraOpts = [
    [eye_x,
     eye_y,
     eye_z],
    [target_x,
     target_y,
     target_z],
    {
        persp,
        roll
    }
];

const raymarcherOpts = [
    sceneSdf,
    [eye_x,
     eye_y,
     eye_z],
    {
        n,
        eps,
        d_max,
        enablePlane,
        planeHeight
    }
];

const lightingOpts = [
    sceneSdf,
    [light_x,
     light_y,
     light_z],
    {
        eps,
        d_max: light_d_max,
        lightInt,
        lightAmb,
        shadowLightSize: lightSize,
        shadowIter: shdw_n,
        shadowEps: shdw_eps
    }
];

const rendererOpts = {
    sampleCount,
    enableShadows,
    drawCrosshair,
    drawAxis
};

//debugger;

const renderer = new Renderer(cameraOpts, raymarcherOpts, lightingOpts, rendererOpts);
renderer.render();
