/**
 * Note this code is NOT mine yet...
 */
var enable3d = ENABLE3D.enable3d;
var Scene3D = ENABLE3D.Scene3D;
var Canvas = ENABLE3D.Canvas;
var Cameras = ENABLE3D.Cameras;
var MainScene = new Phaser.Class({
    Extends: Scene3D,
    initialize: function MainScene()
    {
        Phaser.Scene.call(this, {
            key: 'MainScene'
        });
    },
    preload: function()
    {
        /**
         * Model by Tomás Laulhé (https://www.patreon.com/quaternius), modifications by Don McCurdy (https://donmccurdy.com)
         * https://threejs.org/examples/#webgl_animation_skinning_morph
         * CC-0 license
         */
        this.load.binary('robot', 'assets/glb/robot.glb')
        this.load.image('sky', 'assets/img/sky.png')
        this.load.html('star', 'assets/svg/star.svg')
    },
    init: function()
    {
        this.requestThirdDimension()
        delete this.robot
        this.stars = []
        this.score = 0

        setupResizer(document.getElementsByTagName("canvas")[0]);
    },
    create: function()
    {
        const zoom = 70
        const w = this.cameras.main.width / zoom
        const h = this.cameras.main.height / zoom
        this.cams = {
            ortho: Cameras.OrthographicCamera(this,
            {
                left: w / -2,
                right: w / 2,
                top: h / 2,
                bottom: h / -2
            }),
            perspective: Cameras.PerspectiveCamera(this),
            active: 'perspective',
            inTransition: false,
            offset: null
        }
        this.accessThirdDimension({
            camera: this.cams.perspective,
            gravity: {
                x: 0,
                y: -20,
                z: 0
            }
        })
        this.third.warpSpeed('-ground', '-sky', '-orbitControls')
        this.cams.offset = this.third.new.vector3()
        let ortho = Cameras.OrthographicCamera(this)
        const flash = delay =>
        {
            this.time.addEvent(
            {
                delay: delay,
                callback: () =>
                {
                    this.cameras.main.flash(250, 0, 0, 0, true)
                }
            })
        }
        this.input.keyboard.on('keydown-F', () =>
        {
            if (this.cams.active === 'perspective')
            {
                this.cams.inTransition = true
                this.time.addEvent(
                {
                    delay: 300,
                    callback: () =>
                    {
                        this.third.camera = this.cams.ortho
                        this.cams.inTransition = false
                    }
                })
                this.cams.active = 'ortho'
                flash(250)
                // restrict linear factor on z-axis
                this.robot.body.setLinearFactor(1, 1, 0)
                // set zero velocity on x-axis
                this.robot.body.setVelocityZ(0)
            }
            else
            {
                this.third.camera = this.cams.perspective
                this.cams.active = 'perspective'
                flash(10)
                this.robot.body.setLinearFactor(1, 1, 0)
            }
        })
        // adjust gamma factor
        this.third.renderer.gammaFactor = 1.2
        // adjust the camera
        this.third.camera.position.set(0, 5, 20)
        this.third.camera.lookAt(0, 0, 0)
        // enable physics debugging
        // this.third.physics.debug.enable()
        // add background image
        const sky = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'sky')
        const scaleX = this.cameras.main.width / sky.width
        const scaleY = this.cameras.main.height / sky.height
        const scale = Math.max(scaleX, scaleY)
        sky.depth = -1
        sky.setScale(scale).setScrollFactor(0)
        // add score text
        this.scoreText = this.add.text(32, this.cameras.main.height - 32, 'score: 0',
        {
            fontSize: '32px',
            fill: '#000'
        })
        this.scoreText.setOrigin(0, 1)
        this.scoreText.depth = 1
        // add platforms
        const platformMaterial = {
            phong:
            {
                transparent: true,
                color: 0x21572f
            }
        }
        const platforms = [
            this.third.physics.add.box(
            {
                name: 'platform-ground',
                y: -2,
                width: 30,
                depth: 10,
                height: 2,
                mass: 0
            }, platformMaterial),
            this.third.physics.add.box(
            {
                name: 'platform-right1',
                x: 7,
                y: 4,
                width: 15,
                depth: 10,
                mass: 0
            }, platformMaterial),
            // this.third.physics.add.box({ name: 'platform-left', x: -10, y: 7, width: 10, depth: 5, mass: 0 }, platformMaterial),
            this.third.physics.add.box({
                name: 'platform-right2',
                x: 10,
                y: 10,
                width: 10,
                depth: 10,
                mass: 0
            }, platformMaterial)
        ]
        // add stars
        const starShape = this.third.transform.fromSVGtoShape('star')
        const starScale = 250
        const starPositions = [
        {
            x: -14,
            y: 8.5
        },
        {
            x: -12,
            y: 8.5
        },
        {
            x: -10,
            y: 8.5
        },
        {
            x: -8,
            y: 8.5
        },
        {
            x: -6,
            y: 8.5
        },
        {
            x: -4,
            y: 0
        },
        {
            x: -2,
            y: 0
        },
        {
            x: 0,
            y: 5.5
        },
        {
            x: 2,
            y: 5.5
        },
        {
            x: 4,
            y: 5.5
        },
        {
            x: 6,
            y: 11.5
        },
        {
            x: 8,
            y: 11.5
        },
        {
            x: 10,
            y: 11.5
        },
        {
            x: 12,
            y: 11.5
        },
        {
            x: 14,
            y: 11.5
        }]
        starPositions.forEach((pos, i) =>
        {
            const star = this.third.add.extrude(
            {
                shape: starShape[0],
                depth: 120
            })
            star.name = `star - ${i}`;
            star.scale.set(1 / starScale, 1 / -starScale, 1 / starScale)
            star.material.color.setHex(0xffd851)
            star.position.setX(pos.x)
            star.position.setY(pos.y)
            this.third.physics.add.existing(star,
            {
                shape: 'box',
                width: 0.5,
                height: 0.5,
                depth: 0.5
            })
            star.body.setCollisionFlags(6)
            this.stars.push(star)
        })
        // add robot
        this.third.load.gltf('robot', gltf =>
        {
            this.robot = this.third.new.extendedObject3D()
            this.robot.add(gltf.scene)
            const scale = 1 / 3
            this.robot.scale.set(scale, scale, scale)
            this.robot.traverse(child =>
            {
                if (child.isMesh)
                {
                    child.castShadow = child.receiveShadow = true
                }
            })
            // animations
            this.robot.mixer = this.third.new.animationMixer(this.robot)
            gltf.animations.forEach(animation =>
            {
                this.robot.anims[animation.name] = animation
            })
            this.robot.setAction('Idle')
            this.third.add.existing(this.robot)
            this.third.physics.add.existing(this.robot,
            {
                shape: 'box',
                width: 0.5,
                depth: 0.5,
                offset:
                {
                    y: -0.5
                }
            })
            this.robot.body.setLinearFactor(1, 1, 1)
            this.robot.body.setAngularFactor(0, 0, 0)
            this.robot.body.setFriction(0)
            this.third.camera.lookAt(this.robot.position)
            // add a sensor
            const sensor = this.third.new.extendedObject3D()
            sensor.position.setY(-0.5)
            this.third.physics.add.existing(sensor,
            {
                mass: 1e-8,
                shape: 'box',
                width: 0.2,
                height: 0.2,
                depth: 0.2
            })
            sensor.body.setCollisionFlags(4)
            // connect sensor to robot
            this.third.physics.add.constraints.lock(this.robot.body, sensor.body)
            // detect if sensor is on the ground
            sensor.body.on.collision((otherObject, event) =>
            {
                if (/platform/.test(otherObject.name))
                {
                    if (event !== 'end') this.robot.userData.onGround = true
                    else this.robot.userData.onGround = false
                }
            })
            // check robot overlap with star
            this.robot.body.on.collision((otherObject, event) =>
            {
                if (/star/.test(otherObject.name))
                {
                    if (!otherObject.userData.dead)
                    {
                        otherObject.userData.dead = true
                        otherObject.visible = false
                        this.score += 10
                        this.scoreText.setText(`score: ${this.score}`)
                    }
                }
            })
        })
        // add keys
        this.keys = {
            w: this.input.keyboard.addKey('w'),
            a: this.input.keyboard.addKey('a'),
            s: this.input.keyboard.addKey('s'),
            d: this.input.keyboard.addKey('d'),
            space: this.input.keyboard.addKey('space')
        }
    },
    walkAnimation: function()
    {
        if (this.robot.currentAnimation !== 'Walking') this.robot.setAction('Walking')
    },
    idleAnimation: function()
    {
        if (this.robot.currentAnimation !== 'Idle') this.robot.setAction('Idle')
    },
    update: function(time, delta)
    {
        // rotate the starts
        // (this looks strange I know, I will try to improve this in a future update)
        this.stars.forEach(star =>
        {
            star.body.transform()
            const y = star.body.getRotation().y
            star.body.setRotation(0, y + 0.03, 0)
            star.body.refresh()
        })
        if (this.robot && this.robot.body)
        {
            // add just the camera position
            const withPerspective = this.cams.active === 'perspective'
            const inTransition = this.cams.inTransition
            const cameraOffset = {
                x: withPerspective ? -16 : 0,
                y: withPerspective ? 4 : 2,
                z: withPerspective ? 0 : 16
            }
            this.cams.offset.lerp(cameraOffset, 0.2)
            this.third.camera.position.copy(this.robot.position).add(this.third.new.vector3(this.cams.offset.x, this.cams.offset.y, this.cams.offset.z))
            if (withPerspective || inTransition) this.third.camera.lookAt(this.robot.position.clone().add(this.third.new.vector3(0, 2, 0)))
            else this.third.camera.lookAt(this.third.camera.position.clone())
            // get rotation of robot
            const theta = this.robot.world.theta
            this.robot.body.setAngularVelocityY(0)
            // set the speed variable
            const speed = 7
            if (!withPerspective)
            {
                // A key
                if (this.keys.a.isDown)
                {
                    this.robot.body.setVelocityX(-speed)
                    if (theta > -(Math.PI / 2)) this.robot.body.setAngularVelocityY(-10)
                    this.walkAnimation()
                }
                // D key
                else if (this.keys.d.isDown)
                {
                    this.robot.body.setVelocityX(speed)
                    if (theta < Math.PI / 2) this.robot.body.setAngularVelocityY(10)
                    this.walkAnimation()
                }
                // do not move
                else
                {
                    this.robot.body.setVelocityX(0)
                    this.idleAnimation()
                }
            }
            else
            {
                const walkDirection = {
                    x: 0,
                    z: 0
                }
                // A key
                if (this.keys.a.isDown)
                {
                    walkDirection.z = -speed
                    // this.walkAnimation()
                }
                // D key
                else if (this.keys.d.isDown)
                {
                    walkDirection.z = speed
                    // this.walkAnimation()
                }
                else
                {
                    walkDirection.z = 0
                    // this.idleAnimation()
                }
                // W Key
                if (this.keys.w.isDown)
                {
                    walkDirection.x = speed
                    // this.walkAnimation()
                }
                // S key
                else if (this.keys.s.isDown)
                {
                    walkDirection.x = -speed
                    // this.walkAnimation()
                }
                else
                {
                    walkDirection.x = 0
                    // this.idleAnimation()
                }
                // walk
                this.robot.body.setVelocityX(walkDirection.x)
                this.robot.body.setVelocityZ(walkDirection.z)
                // is idle?
                const isIdle = walkDirection.x === 0 && walkDirection.z === 0
                if (isIdle) this.idleAnimation()
                else this.walkAnimation()
                // turn player
                if (!isIdle)
                {
                    const directionTheta = Math.atan2(walkDirection.x, walkDirection.z) + Math.PI
                    const playerTheta = this.robot.world.theta + Math.PI
                    const diff = directionTheta - playerTheta
                    if (diff > 0.25) this.robot.body.setAngularVelocityY(10)
                    if (diff < -0.25) this.robot.body.setAngularVelocityY(-10)
                }
            }
            // jump
            if (this.keys.space.isDown && this.robot.userData.onGround && Math.abs(this.robot.body.velocity.y) < 1e-1)
            {
                this.robot.setAction('WalkJump')
                this.robot.body.applyForceY(16)
            }
        }
    }
});

const config = {
    type: Phaser.WEBGL,
    scene: [MainScene],
};

var canv = Canvas();
for(var i in canv)
{
    config[i] = canv[i];
}

window.addEventListener('load', () =>
{
    enable3d(() => new Phaser.Game(config)).withPhysics('./libraries')
})
