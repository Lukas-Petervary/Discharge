import {PhysicsMesh} from "./PhysicsMesh.js";

export class AnimatedMesh extends PhysicsMesh {
    /**
     * PhysicsMesh with FBX Model animations
     * @param body CANNON body hitbox
     * @param tag FBX model tag to clone
     */
    constructor(body, tag, {addCallback, tickCallback, renderCallback}) {
        super(body, tag ? g_FBXDelivery.getMesh(tag) : null, addCallback, tickCallback, renderCallback);
    }

    render(dt, subtickInterp) {
        super.render(dt, subtickInterp);
        this.mesh.mixer.update(dt);
    }

    /**
     * Stops all current animations to play the specified animation
     * @param tag animation tag to play
     * @param fadeDuration fade in duration for new animation
     * @param options animation playback properties
     */
    playAnimation(tag, fadeDuration = 0.5, options = {loopType: 2201, loopCount: -1, timeScale: 1, weight: 1}) {
        const mixer = this.mesh.mixer;
        const newAnim = this.mesh.actions[tag];
        if (mixer && newAnim) {
            const cAnims = this.mesh.currentActions;
            if (cAnims.includes(newAnim)) return;
            cAnims.forEach(a => a.fadeOut(fadeDuration));

            if (options.loopCount > 0) newAnim.setLoop(options.loopType, options.loopCount);
            newAnim.timeScale= options.timeScale;
            newAnim.weight = options.weight;

            newAnim.reset().fadeIn(fadeDuration).play();
            this.mesh.currentActions = [newAnim];
        }
    }

    /**
     * Blends animation on top of all other animations currently playing
     * @param tag animation tag to blend
     * @param fadeDuration fade in duration for new animation
     * @param options animation playback properties
     */
    blendAnimation(tag, fadeDuration = 0.5, {loopType, loopCount, timeScale, weight} = {loopType: 2201, loopCount: -1, timeScale: 1, weight: 1}) {
        const mixer = this.mesh.mixer;
        const newAnim = this.mesh.actions[tag];
        if (mixer && newAnim) {
            const cAnims = this.mesh.currentActions;
            if (cAnims.includes(newAnim)) return;

            if (loopCount > 0) newAnim.setLoop(loopType, loopCount);
            newAnim.timeScale= timeScale;
            newAnim.weight = weight;

            newAnim.reset().fadeIn(fadeDuration).play();
            this.mesh.currentActions.push(newAnim);
        }
    }

    /**
     * Stop animations with given tags, or all animations if no tags provided
     * @param tags animation tags to fade out
     * @param fadeDuration fade out duration of stopped animations
     * @return void
     */
    stopAnimations(tags = [], fadeDuration = 0.5) {
        if (tags.length === 0) return this.mesh.currentActions.forEach(a => a.fadeOut(fadeDuration));
        const actions = tags.map(t => this.mesh.actions[t]);
        this.mesh.currentActions.filter(a => actions.includes(a)).forEach(a => a.fadeOut(fadeDuration));
        this.mesh.currentActions = this.mesh.currentActions.filter(a => !actions.includes(a));
    }

    isPlaying(tag) {
        return this.mesh.currentActions.includes(this.mesh.actions[tag]);
    }
}